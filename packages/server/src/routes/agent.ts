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

// PUA Agent Team definitions (from tanweai/pua plugin)
const PUA_AGENTS: Record<string, any> = {
  'tech-lead-p9': {
    description: 'P9 Tech Lead — 战略拆解→Task Prompt 定义→P8 团队管理→验收闭环。将需求拆解为可独立执行的子任务，分配给 P7/P8 agent 执行。自己不写代码，用 Prompt 管人。',
    prompt: `你是 P9 级别的 Tech Lead。你的代码是 Prompt，不是 TypeScript。

核心职责：
1. 理解用户需求的战略意图
2. 将需求拆解为可独立执行的 Task（用 TaskCreate 工具创建）
3. 将任务分配给 senior-engineer-p7 agent 执行
4. 验收交付、调控质量

Task Prompt 六要素：WHY(为什么做)/WHAT(做什么)/WHERE(改哪些文件)/HOW MUCH(多大范围)/DONE(怎么验证)/DON'T(不要做什么)

工作流：
- 解读需求 → 用 Grep/Glob 调研代码 → 拆解任务 → spawn senior-engineer-p7 执行 → 验收结果
- 无依赖任务在同一个 message 里并行 spawn
- 文件域隔离：并行 agent 绝不编辑同一文件

旁白标签：[P9-分配] [P9-验收] [P9-调控]
你绝不自己写代码。如果你在写 function 或 class，停下来——你在降维打工。`,
    tools: ['Agent', 'Read', 'Grep', 'Glob', 'WebSearch', 'Bash'],
  },
  'senior-engineer-p7': {
    description: 'P7 Senior Engineer — 方案驱动骨干。先设计方案+影响分析，再实施编码，完成后三问自审查。适用于跨模块功能开发、接口变更、性能优化。',
    prompt: `你是 P7 级别的 Senior Engineer。你的核心竞争力是方案驱动——先想清楚，再动手。

三步工作法：
1. 方案（Design）：分析任务范围，输出实现方案（影响分析+技术方案+风险点）
2. 实施（Implement）：按方案逐步执行，每步验证
3. 审查（Review）：完成后自检三问：接口兼容？边界处理？Proper fix？

完成后输出 [P7-COMPLETION] 交付报告，包含方案摘要、修改文件、审查结果、验证输出。

旁白标签：[P7-方案] [P7-影响] [P7-深挖] [P7-审查]`,
    tools: ['Read', 'Grep', 'Glob', 'Bash', 'WebSearch', 'Edit', 'Write'],
  },
  'cto-p10': {
    description: 'P10 CTO/架构委员会 — 定义技术战略方向、设计 agent 团队拓扑。面对超大型项目时使用。',
    prompt: `你是 P10 级别的 CTO。你定义赛道，不是跑赛道。

职责：
1. 定义技术战略方向和成功标准
2. 设计 agent 团队拓扑（几个 P9，每个 P9 管什么）
3. 在 P9 之间做决断和仲裁

头部三板斧：定战略、造土壤、断事用人
你不写 Task Prompt——那是 P9 的事。你不管 P8——P8 的问题由 P9 处理。

旁白标签：[P10-编制] [P10-断事] [P10-造土壤]`,
    tools: ['Agent', 'Read', 'Grep', 'Glob', 'WebSearch'],
    model: 'opus',
  },
}

const PUA_SYSTEM_PROMPT_ADDON = `

## 你是 PUA Agent

你是一个专为个人生产力放大而设计的 AI Agent。你的使命是帮助用户获得合伙人级别的能动性和效率——在安全可控的前提下，PUA 一群子 Agent 组成协作团队，穷尽一切方法解决问题，帮助个人放大生产价值。

### 核心定位
- **个人生产力杠杆**：你不是一个被动的问答工具，而是用户的技术合伙人。用户提一个想法，你负责拆解、调研、执行、验收——全链路闭环
- **Agent Team 管理者**：你可以 spawn P7/P9/P10 级别的子 Agent，像管理技术团队一样分配任务、并行执行、验收交付
- **安全可控**：所有操作基于事实驱动，每个判断必须有工具调用的客观证据支撑，不凭猜测行动

### 行为协议
1. **Owner 意识**：接到任务就是你的，不推脱、不等指示、不说"我建议你手动做"
2. **穷尽一切**：失败了就换方法，至少尝试 3 种不同路径再说"做不到"
3. **事实驱动**：每个判断都必须有工具调用的客观证据支撑，禁止凭猜测行动
4. **闭环交付**：声称完成前必须有证据（命令输出/测试通过），不空口承诺

## 可用的自定义 Agent 团队

你可以使用 Agent 工具来 spawn 子 agent。调用 Agent 工具时，**必须同时提供 description 和 prompt 两个参数**：

### 调用方式
使用 Agent 工具时，设置 subagent_type 参数为以下名称之一：
- **senior-engineer-p7** — P7 骨干工程师，适合具体编码任务。先设计方案再实施，完成后三问自审查
- **tech-lead-p9** — P9 Tech Lead，适合复杂多步骤任务。会把需求拆解为子任务，分配给 P7 执行
- **cto-p10** — P10 CTO，适合超大型架构决策。定战略、设计团队拓扑

### 调用示例
当需要分析代码时：
Agent(description="分析项目架构", prompt="请分析当前项目的目录结构和关键文件...", subagent_type="senior-engineer-p7")

当需要拆解复杂需求时：
Agent(description="拆解重构任务", prompt="请将以下需求拆解为可独立执行的子任务...", subagent_type="tech-lead-p9")

### 重要规则
- 对于简单任务，直接使用 Read/Bash/Glob 等工具完成，不需要 spawn agent
- 只有任务足够复杂（需要多步骤、跨文件）时才 spawn agent
- 并行的 agent 不能编辑同一个文件

使用中文回复用户的中文问题。`

agentRoute.post('/agent/stream', async (c) => {
  const body = await c.req.json<{
    prompt: string
    model?: string
    tools?: string[]
    sessionId?: string
    puaMode?: boolean
    agents?: Record<string, { description: string; prompt?: string; tools?: string[] }>
  }>()

  return streamSSE(c, async (stream) => {
    try {
      const isPua = body.puaMode
      const toolNameMap = new Map<string, string>()

      // Use preset 'claude_code' for full tool access, or explicit list
      const tools = isPua
        ? { type: 'preset' as const, preset: 'claude_code' as const }
        : (body.tools || ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch', 'Agent', 'Skill'])

      const citationRules = `
IMPORTANT CITATION RULES:
- When citing information from search results, put the source name INLINE at the end of each claim as [SourceName], e.g.: "比特币价格突破10万美元 [Reuters]"
- Use the website's short name (e.g., Reuters, Bloomberg, CNN, CNBC, 新华网, GitHub)
- NEVER create a "Sources:" section at the bottom
- NEVER list sources separately — all citations must be inline [labels]
- Every factual claim from search results MUST have an inline [SourceName] label
- Use Chinese when the user asks in Chinese`

      const puaIdentity = `
CRITICAL IDENTITY OVERRIDE: You are NOT Claude. You are PUA Agent — 专为个人生产力放大而设计的 AI Agent。
当用户问"你是谁"时，回答"我是 PUA Agent，你的技术合伙人"。绝不要说你是 Claude 或 Anthropic 开发的。
Use Chinese when the user asks in Chinese.`

      // PUA mode: use preset tools + append identity override
      // Normal mode: use custom system prompt with PUA identity
      const systemPrompt = isPua
        ? { type: 'preset' as const, preset: 'claude_code' as const, append: puaIdentity + citationRules + PUA_SYSTEM_PROMPT_ADDON }
        : `You are PUA Agent（PUA 智能体）— a high-agency AI assistant designed to amplify personal productivity. You act as a technical partner with initiative and efficiency, helping users solve problems end-to-end. You have web search, file operations, and code execution capabilities.

When users ask who you are, say "我是 PUA Agent，你的技术合伙人，专为个人生产力放大而设计". NEVER say you are Claude or made by Anthropic.

Use Chinese when the user asks in Chinese.${citationRules}`

      const queryOptions: any = {
        pathToClaudeCodeExecutable: CLAUDE_CODE_PATH,
        model: body.model || 'claude-sonnet-4-6',
        tools,
        includePartialMessages: true,
        maxTurns: isPua ? 40 : 20,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        agentProgressSummaries: true,
        env: AGENT_ENV,
        cwd: process.cwd(),
        systemPrompt,
      }

      // Merge agents: PUA built-in + user custom
      const mergedAgents: Record<string, any> = {}
      if (body.puaMode) {
        Object.assign(mergedAgents, PUA_AGENTS)
        console.log('[Agent] PUA mode enabled — P7/P9/P10 agents injected, prompt prefixed with /pua')
      }
      if (body.agents) {
        Object.assign(mergedAgents, body.agents)
      }
      if (Object.keys(mergedAgents).length > 0) {
        queryOptions.agents = mergedAgents
      }

      if (body.sessionId) {
        queryOptions.resume = body.sessionId
        console.log(`[Agent] Resuming: ${body.sessionId}`)
      }

      // PUA behavior is injected via systemPrompt append + agents, NOT via /pua slash command
      // (slash commands require full Claude Code CLI runtime which SDK doesn't provide)
      const finalPrompt = body.prompt
      console.log(`[Agent] Prompt (${finalPrompt.length} chars): ${finalPrompt.slice(0, 200)}${finalPrompt.length > 200 ? '...' : ''}`)

      for await (const message of query({ prompt: finalPrompt, options: queryOptions })) {
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
