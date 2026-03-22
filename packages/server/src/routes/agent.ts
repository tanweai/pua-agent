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
    agents?: Record<string, { description: string; prompt?: string; tools?: string[] }>
  }>()

  return streamSSE(c, async (stream) => {
    try {
      const allowedTools = body.tools || ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch', 'Agent', 'Skill']
      const toolNameMap = new Map<string, string>()

      const queryOptions: any = {
        pathToClaudeCodeExecutable: CLAUDE_CODE_PATH,
        model: body.model || 'claude-sonnet-4-6',
        allowedTools,
        includePartialMessages: true,
        maxTurns: 20,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        agentProgressSummaries: true,
        env: AGENT_ENV,
        cwd: process.cwd(),
        systemPrompt: `You are a helpful AI assistant with web search capabilities.

IMPORTANT CITATION RULES:
- When citing information from search results, put the source name INLINE at the end of each claim as [SourceName], e.g.: "比特币价格突破10万美元 [Reuters]"
- Use the website's short name (e.g., Reuters, Bloomberg, CNN, CNBC, 新华网, GitHub)
- NEVER create a "Sources:" section at the bottom
- NEVER list sources separately — all citations must be inline [labels]
- Every factual claim from search results MUST have an inline [SourceName] label
- Use Chinese when the user asks in Chinese`,
      }

      if (body.agents && Object.keys(body.agents).length > 0) {
        queryOptions.agents = body.agents
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

        // === system messages: init, task_started, task_progress, task_notification ===
        if (msg.type === 'system') {
          if (msg.subtype === 'init') {
            console.log(`[Agent] Session: ${msg.session_id}`)
            await writeEvent(stream, {
              type: 'session_init' as any,
              session_id: msg.session_id,
              tools: msg.tools,
              agents: msg.agents,
              mcp_servers: msg.mcp_servers,
            })
          }
          if (msg.subtype === 'task_started') {
            await writeEvent(stream, {
              type: 'task_started' as any,
              tool_use_id: msg.tool_use_id,
              session_id: msg.session_id,
            })
          }
          if (msg.subtype === 'task_progress') {
            await writeEvent(stream, {
              type: 'task_progress' as any,
              tool_use_id: msg.tool_use_id,
              usage: msg.usage,
              tool_use_count: msg.tool_use_count,
              duration_ms: msg.duration_ms,
              summary: msg.summary,
            })
          }
          if (msg.subtype === 'task_notification') {
            await writeEvent(stream, {
              type: 'task_notification' as any,
              tool_use_id: msg.tool_use_id,
              session_id: msg.session_id,
              message: msg.message,
            })
          }
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
          await writeEvent(stream, {
            type: 'agent_result' as any,
            subtype: msg.subtype,
            total_cost_usd: msg.total_cost_usd,
            total_input_tokens: msg.usage?.input_tokens,
            total_output_tokens: msg.usage?.output_tokens,
            num_turns: msg.num_turns,
          })
        }

        // === rate_limit_event ===
        if (msg.type === 'rate_limit_event') {
          await writeEvent(stream, {
            type: 'rate_limit' as any,
            utilization: msg.utilization,
            resets_at: msg.resets_at,
          })
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

// Available tools/skills for the frontend UI
const AVAILABLE_TOOLS = [
  { name: 'WebSearch', icon: 'search', description: 'Search the web for information', category: 'search' },
  { name: 'WebFetch', icon: 'globe', description: 'Fetch and analyze web pages', category: 'search' },
  { name: 'Read', icon: 'file-text', description: 'Read files in the workspace', category: 'file' },
  { name: 'Glob', icon: 'folder-search', description: 'Find files by pattern', category: 'file' },
  { name: 'Grep', icon: 'search', description: 'Search file contents', category: 'file' },
  { name: 'Bash', icon: 'terminal', description: 'Execute shell commands', category: 'system' },
  { name: 'Agent', icon: 'bot', description: 'Spawn subagents for complex tasks', category: 'agent' },
  { name: 'Skill', icon: 'zap', description: 'Invoke specialized skills', category: 'agent' },
]

agentRoute.get('/agent/tools', (c) => {
  return c.json({ tools: AVAILABLE_TOOLS })
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
