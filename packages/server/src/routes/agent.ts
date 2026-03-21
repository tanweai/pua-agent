import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, realpathSync } from 'fs'

export const agentRoute = new Hono()

function findCliJs(): string {
  const symlinkPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', '@anthropic-ai', 'claude-agent-sdk', 'cli.js')
  try { const real = realpathSync(symlinkPath); if (existsSync(real)) return real } catch {}
  const global = '/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js'
  if (existsSync(global)) return global
  throw new Error('Claude Code cli.js not found')
}

const CLAUDE_CODE_PATH = findCliJs()
console.log(`[Agent] CLI: ${CLAUDE_CODE_PATH}`)

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

agentRoute.post('/agent/stream', async (c) => {
  const body = await c.req.json<{
    prompt: string
    model?: string
    tools?: string[]
    sessionId?: string
  }>()

  return streamSSE(c, async (stream) => {
    try {
      const allowedTools = body.tools || ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch']
      const toolNameMap = new Map<string, string>()

      const queryOptions: any = {
        pathToClaudeCodeExecutable: CLAUDE_CODE_PATH,
        model: body.model || 'claude-sonnet-4-6',
        allowedTools,
        includePartialMessages: true,  // KEY: enables native SSE stream events
        maxTurns: 20,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        env: AGENT_ENV,
        cwd: process.cwd(),
      }

      if (body.sessionId) {
        queryOptions.resume = body.sessionId
        console.log(`[Agent] Resuming: ${body.sessionId}`)
      }

      for await (const message of query({ prompt: body.prompt, options: queryOptions })) {
        const msg = message as any

        // === stream_event: native Anthropic SSE — pass through directly ===
        if (msg.type === 'stream_event') {
          const event = msg.event

          // Track tool names for tool_result correlation
          if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            const id = event.content_block.id
            const name = event.content_block.name
            if (id && name) toolNameMap.set(id, name)
          }

          // Forward the raw event to frontend — zero translation needed
          await writeEvent(stream, event)
        }

        // === system/init: emit session_id for multi-turn ===
        if (msg.type === 'system' && msg.subtype === 'init') {
          console.log(`[Agent] Session: ${msg.session_id}`)
          await writeEvent(stream, { type: 'session_init' as any, session_id: msg.session_id })
        }

        // === user: tool results — emit for SearchCard ===
        if (msg.type === 'user' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'tool_result' && block.tool_use_id) {
              const content = typeof block.content === 'string' ? block.content : JSON.stringify(block.content || '')
              const toolName = toolNameMap.get(block.tool_use_id) || 'tool'
              await writeEvent(stream, {
                type: 'tool_result' as any,
                tool_use_id: block.tool_use_id,
                tool_name: toolName,
                content: parseToolResult(toolName, content),
              })
            }
          }
        }

        // === result: final output ===
        if (msg.type === 'result') {
          console.log(`[Agent] Done: ${msg.subtype}, cost=$${msg.total_cost_usd?.toFixed(4) || '?'}`)
        }
      }
    } catch (err: any) {
      console.error('[Agent Error]', err.message)
      // Send error as text block
      await writeEvent(stream, { type: 'message_start', message: { id: 'err', type: 'message', role: 'assistant', model: 'error', content: [], stop_reason: null, usage: { input_tokens: 0, output_tokens: 0 } } })
      await writeEvent(stream, { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
      await writeEvent(stream, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: `**Error:** ${err.message}` } })
      await writeEvent(stream, { type: 'content_block_stop', index: 0 })
      await writeEvent(stream, { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 0 } })
      await writeEvent(stream, { type: 'message_stop' })
    }
  })
})

function parseToolResult(toolName: string, content: any): any {
  const text = typeof content === 'string' ? content : JSON.stringify(content)
  if (toolName === 'WebSearch' || toolName === 'web_search') {
    const results: { title: string; url: string; domain: string }[] = []
    const re = /"title"\s*:\s*"([^"]+)"[^}]*?"link"\s*:\s*"([^"]+)"/g
    let m
    while ((m = re.exec(text)) !== null) {
      const title = m[1], url = m[2].replace(/\\"/g, '"')
      let domain = ''; try { domain = new URL(url).hostname } catch {}
      if (title && !results.some(r => r.title === title)) results.push({ title, url, domain })
    }
    if (results.length === 0) {
      const urlRe = /https?:\/\/[^\s"',)}\]]+/g
      let um
      while ((um = urlRe.exec(text)) !== null) {
        const url = um[0].replace(/[\\]+$/, '')
        let domain = ''; try { domain = new URL(url).hostname } catch { continue }
        if (!results.some(r => r.domain === domain)) results.push({ title: domain, url, domain })
      }
    }
    if (results.length > 0) return { results }
  }
  return { results: [] }
}
