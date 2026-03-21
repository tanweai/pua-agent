import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, realpathSync } from 'fs'

export const agentRoute = new Hono()

function findCliJs(): string {
  const symlinkPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', '@anthropic-ai', 'claude-agent-sdk', 'cli.js')
  try {
    const real = realpathSync(symlinkPath)
    if (existsSync(real)) return real
  } catch {}
  const global = '/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js'
  if (existsSync(global)) return global
  throw new Error('Claude Code cli.js not found')
}

const CLAUDE_CODE_PATH = findCliJs()
console.log(`[Agent] CLI path: ${CLAUDE_CODE_PATH}`)

const AGENT_ENV = {
  ...process.env,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://open.bigmodel.cn/api/anthropic',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  DISABLE_AUTOUPDATER: '1',
}

async function writeEvent(stream: any, event: object) {
  await stream.writeSSE({ event: 'message', data: JSON.stringify(event) })
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// Stream text with natural typing pace
async function streamText(stream: any, index: number, deltaType: string, field: string, text: string, chunkSize = 4, delayMs = 15) {
  for (let i = 0; i < text.length; i += chunkSize) {
    await writeEvent(stream, { type: 'content_block_delta', index, delta: { type: deltaType, [field]: text.slice(i, i + chunkSize) } })
    await delay(delayMs)
  }
}

agentRoute.post('/agent/stream', async (c) => {
  const body = await c.req.json<{
    prompt: string
    model?: string
    tools?: string[]
  }>()

  return streamSSE(c, async (stream) => {
    let blockIndex = 0
    const toolNameMap = new Map<string, string>()

    try {
      const msgId = 'msg_agent_' + Date.now()
      await writeEvent(stream, {
        type: 'message_start',
        message: { id: msgId, type: 'message', role: 'assistant', model: body.model || 'agent', content: [], stop_reason: null, usage: { input_tokens: 0, output_tokens: 0 } },
      })

      const allowedTools = body.tools || ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch']

      for await (const message of query({
        prompt: body.prompt,
        options: {
          pathToClaudeCodeExecutable: CLAUDE_CODE_PATH,
          model: body.model || 'claude-sonnet-4-6',
          allowedTools,
          maxTurns: 20,
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          env: AGENT_ENV,
          cwd: process.cwd(),
        },
      })) {
        const msg = message as any

        // === system/init ===
        if (msg.type === 'system' && msg.subtype === 'init') {
          console.log(`[Agent] Session: ${msg.session_id}, model: ${msg.model}`)
        }

        // === assistant — contains content blocks (text, tool_use, thinking) ===
        if (msg.type === 'assistant' && msg.message?.content) {
          for (const block of msg.message.content) {
            // Thinking block
            if (block.type === 'thinking' && block.thinking) {
              await writeEvent(stream, { type: 'content_block_start', index: blockIndex, content_block: { type: 'thinking', thinking: '', signature: '' } })
              await streamText(stream, blockIndex, 'thinking_delta', 'thinking', block.thinking, 6, 12)
              if (block.signature) {
                await writeEvent(stream, { type: 'content_block_delta', index: blockIndex, delta: { type: 'signature_delta', signature: block.signature } })
              }
              await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
              blockIndex++
            }

            // Text block — natural typing speed
            if (block.type === 'text' && block.text) {
              await writeEvent(stream, { type: 'content_block_start', index: blockIndex, content_block: { type: 'text', text: '' } })
              await streamText(stream, blockIndex, 'text_delta', 'text', block.text, 4, 18)
              await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
              blockIndex++
            }

            // Tool use block — this is what we need for SearchCard!
            if (block.type === 'tool_use') {
              const toolName = block.name || 'unknown'
              const toolId = block.id || `tool_${blockIndex}`
              toolNameMap.set(toolId, toolName)
              console.log(`[Agent] Tool call: ${toolName} id=${toolId}`, JSON.stringify(block.input || {}).slice(0, 100))

              await writeEvent(stream, {
                type: 'content_block_start', index: blockIndex,
                content_block: { type: 'tool_use', id: toolId, name: toolName, input: {} },
              })
              await writeEvent(stream, {
                type: 'content_block_delta', index: blockIndex,
                delta: { type: 'input_json_delta', partial_json: JSON.stringify(block.input || {}) },
              })
              await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
              blockIndex++
            }
          }
        }

        // === user with tool results ===
        if (msg.type === 'user' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'tool_result' && block.tool_use_id) {
              const content = typeof block.content === 'string' ? block.content : JSON.stringify(block.content || '')
              console.log(`[Agent] Tool result for ${block.tool_use_id}: ${content.slice(0, 150)}`)

              const resolvedToolName = toolNameMap.get(block.tool_use_id) || 'tool'
              await writeEvent(stream, {
                type: 'tool_result' as any,
                tool_use_id: block.tool_use_id,
                tool_name: resolvedToolName,
                content: parseToolResult(resolvedToolName, content),
              })
            }
          }
        }

        // === result — final output ===
        if (msg.type === 'result') {
          const resultText = msg.result || ''
          if (resultText) {
            await writeEvent(stream, { type: 'content_block_start', index: blockIndex, content_block: { type: 'text', text: '' } })
            await streamText(stream, blockIndex, 'text_delta', 'text', resultText, 4, 18)
            await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
            blockIndex++
          }

          await writeEvent(stream, { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: blockIndex * 50 } })
          await writeEvent(stream, { type: 'message_stop' })
        }
      }
    } catch (err: any) {
      console.error('[Agent Error]', err.message)
      await writeEvent(stream, { type: 'content_block_start', index: blockIndex, content_block: { type: 'text', text: '' } })
      await writeEvent(stream, { type: 'content_block_delta', index: blockIndex, delta: { type: 'text_delta', text: `**Error:** ${err.message}` } })
      await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
      await writeEvent(stream, { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 0 } })
      await writeEvent(stream, { type: 'message_stop' })
    }
  })
})

// Parse tool results: extract clean title + domain only, no raw JSON
function parseToolResult(toolName: string, content: any): any {
  const text = typeof content === 'string' ? content : JSON.stringify(content)

  if (toolName === 'WebSearch' || toolName === 'web_search') {
    const results: { title: string; url: string; domain: string }[] = []
    // Parse "title":"...","link":"..." pairs from the raw response
    const re = /"title"\s*:\s*"([^"]+)"[^}]*?"link"\s*:\s*"([^"]+)"/g
    let m
    while ((m = re.exec(text)) !== null) {
      const title = m[1]
      const url = m[2].replace(/\\"/g, '"')
      let domain = ''
      try { domain = new URL(url).hostname } catch {}
      if (title && !results.some(r => r.title === title)) {
        results.push({ title, url, domain })
      }
    }
    // Fallback: extract URLs
    if (results.length === 0) {
      const urlRe = /https?:\/\/[^\s"',)}\]]+/g
      let um
      while ((um = urlRe.exec(text)) !== null) {
        const url = um[0].replace(/[\\]+$/, '')
        let domain = ''
        try { domain = new URL(url).hostname } catch { continue }
        if (!results.some(r => r.domain === domain)) {
          results.push({ title: domain, url, domain })
        }
      }
    }
    if (results.length > 0) return { results }
  }
  return { results: [] }
}
