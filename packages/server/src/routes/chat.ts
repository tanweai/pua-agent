import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getClient } from '../lib/anthropic.js'

export const chatRoute = new Hono()

const MOCK_MODE = !process.env.ANTHROPIC_API_KEY

async function writeEvent(stream: any, event: object) {
  await stream.writeSSE({
    event: 'message',
    data: JSON.stringify(event),
  })
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function streamChunked(stream: any, index: number, deltaType: string, fieldName: string, text: string, chunkSize = 5, delayMs = 10) {
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize)
    await writeEvent(stream, {
      type: 'content_block_delta',
      index,
      delta: { type: deltaType, [fieldName]: chunk },
    })
    await delay(delayMs)
  }
}

async function streamMock(stream: any) {
  const msgId = 'msg_mock_' + Date.now()

  // message_start
  await writeEvent(stream, {
    type: 'message_start',
    message: {
      id: msgId, type: 'message', role: 'assistant',
      model: 'claude-opus-4-6-20250514', content: [], stop_reason: null,
      usage: { input_tokens: 150, output_tokens: 0 },
    },
  })

  // === Block 0: Thinking ===
  await writeEvent(stream, {
    type: 'content_block_start', index: 0,
    content_block: { type: 'thinking', thinking: '', signature: '' },
  })

  const thinkingText = `The user wants to test the chat interface. Let me provide a comprehensive response that demonstrates all the features - thinking blocks, markdown rendering, code blocks with syntax highlighting, and tool use cards. I should structure the response to show different formatting capabilities and make sure everything renders correctly in the UI.`

  await streamChunked(stream, 0, 'thinking_delta', 'thinking', thinkingText, 8, 8)

  await writeEvent(stream, {
    type: 'content_block_delta', index: 0,
    delta: { type: 'signature_delta', signature: 'EqQBCgIYAhIM1qK3mNx...' },
  })
  await writeEvent(stream, { type: 'content_block_stop', index: 0 })

  await delay(200)

  // === Block 1: Text intro ===
  await writeEvent(stream, {
    type: 'content_block_start', index: 1,
    content_block: { type: 'text', text: '' },
  })
  await streamChunked(stream, 1, 'text_delta', 'text', `Let me search for the latest information about this topic.\n\n`)
  await writeEvent(stream, { type: 'content_block_stop', index: 1 })

  // === Block 2: Tool use (web_search) ===
  await writeEvent(stream, {
    type: 'content_block_start', index: 2,
    content_block: { type: 'tool_use', id: 'toolu_01mock_search', name: 'web_search', input: {} },
  })
  await writeEvent(stream, {
    type: 'content_block_delta', index: 2,
    delta: { type: 'input_json_delta', partial_json: '{"query":"Claude.ai frontend architecture Vite React implementation"}' },
  })
  await writeEvent(stream, { type: 'content_block_stop', index: 2 })

  await delay(600)

  // Inject tool result (custom event for mock mode)
  await writeEvent(stream, {
    type: 'tool_result' as any,
    tool_use_id: 'toolu_01mock_search',
    tool_name: 'web_search',
    content: {
      results: [
        { title: 'How to use Claude to build a web app - LogRocket Blog', url: 'https://blog.logrocket.com/claude-chat', domain: 'blog.logrocket.com' },
        { title: 'Orchestrator - Product Document | Claude', url: 'https://claude.ai/orchestrator', domain: 'claude.ai' },
        { title: 'Retool | Create a Frontend for Claude', url: 'https://retool.com/claude', domain: 'retool.com' },
        { title: 'GitHub - chihebnabil/claude-ui: A modern chat interface for Anthropic\'s Claude AI models built ...', url: 'https://github.com/chihebnabil/claude-ui', domain: 'github.com' },
        { title: 'Building End-to-End Projects with Claude Code - Claude AI', url: 'https://e.ai.chat/claude', domain: 'e.ai.chat' },
        { title: 'Claude.ai Frontend Architecture Deep Dive', url: 'https://dev.to/claude-frontend', domain: 'dev.to' },
        { title: 'Building AI Chat UIs with Vite + React', url: 'https://medium.com/vite-react-ai', domain: 'medium.com' },
        { title: 'Anthropic Claude Web App Source Analysis', url: 'https://github.com/anthropics/analysis', domain: 'github.com' },
        { title: 'Modern Chat UI Patterns for LLM Applications', url: 'https://ui.dev/chat-patterns', domain: 'ui.dev' },
        { title: 'Claude Streaming API Implementation Guide', url: 'https://docs.anthropic.com/streaming', domain: 'docs.anthropic.com' },
      ],
    },
  })

  // === Block 3: Second round thinking ===
  await writeEvent(stream, {
    type: 'content_block_start', index: 3,
    content_block: { type: 'thinking', thinking: '', signature: '' },
  })
  await streamChunked(stream, 3, 'thinking_delta', 'thinking',
    `The search results don't directly reveal Claude.ai's internal frontend tech stack. Let me search more specifically for the HTML source code analysis and build tooling evidence.`, 8, 8)
  await writeEvent(stream, {
    type: 'content_block_delta', index: 3,
    delta: { type: 'signature_delta', signature: 'FrRBDgIYBhIQ...' },
  })
  await writeEvent(stream, { type: 'content_block_stop', index: 3 })

  await delay(150)

  // === Block 4: Second search ===
  await writeEvent(stream, {
    type: 'content_block_start', index: 4,
    content_block: { type: 'tool_use', id: 'toolu_02mock_search', name: 'web_search', input: {} },
  })
  await writeEvent(stream, {
    type: 'content_block_delta', index: 4,
    delta: { type: 'input_json_delta', partial_json: '{"query":"claude.ai frontend Next.js React tech stack streaming"}' },
  })
  await writeEvent(stream, { type: 'content_block_stop', index: 4 })

  await delay(500)

  await writeEvent(stream, {
    type: 'tool_result' as any,
    tool_use_id: 'toolu_02mock_search',
    tool_name: 'web_search',
    content: {
      results: [
        { title: 'Anthropic Claude Clone in Next.JS and LangChain', url: 'https://github.com/anthropic-clone', domain: 'github.com' },
        { title: 'Agent Skills for Claude Code | Next.js Developer', url: 'https://jeffallan.github.io', domain: 'jeffallan.github.io' },
        { title: 'Claude Code skills for AI apps - Next.js 16', url: 'https://github.com/claude-nextjs', domain: 'github.com' },
        { title: 'Claude Streaming API with Next.js Edge Runtime', url: 'https://www.techedubyte.com/claude-streaming', domain: 'www.techedubyte.com' },
        { title: 'Building Production-Ready Claude Streaming API', url: 'https://dev.to/claude-streaming', domain: 'dev.to' },
      ],
    },
  })

  // === Block 5: Main text response ===
  await writeEvent(stream, {
    type: 'content_block_start', index: 5,
    content_block: { type: 'text', text: '' },
  })

  const mainText = `Based on my research, here's what I found about **Claude.ai's frontend architecture**:

## Key Findings

Claude.ai is built as a **Vite + React SPA** (Single Page Application), not Next.js as many assume.

### Evidence

1. **\`<div id="root"></div>\`** — Classic SPA entry point with no server-rendered HTML
2. **File naming pattern** — \`index-BIdSPwg7.js\`, \`vendor-Dfbm12k5.js\` — Vite's default output
3. **\`modulepreload\`** — Vite's signature feature for optimized module loading

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 6 |
| UI | React 19 (CSR) |
| State | TanStack React Query v5 |
| Styling | Tailwind CSS + custom tokens |
| Code Highlight | Tree-sitter (WASM) |
| Theme | \`data-mode="light/dark"\` |

### Startup Optimization

The most clever optimization is the **IndexedDB preload**:

\`\`\`typescript
// In index.html <script> — runs BEFORE React loads
const dbReq = indexedDB.open("keyval-store");
dbReq.onsuccess = () => {
  const tx = dbReq.result.transaction("keyval", "readonly");
  const req = tx.objectStore("keyval").get("react-query-cache");
  req.onsuccess = () => {
    window.__PRELOADED_IDB_CACHE__ = req.result;
  };
};
\`\`\`

This starts reading the cache **in parallel** with React JS bundle download, so conversations render instantly on app mount.

### Why Not Next.js?

> Claude.ai is a **login-required app** — no SEO, no SSR, no static generation needed. A pure SPA is simpler to deploy (static files on CDN) and Vite's DX is superior for this use case.

The architecture proves that **the right tool for the job** beats following trends.`

  await streamChunked(stream, 5, 'text_delta', 'text', mainText, 6, 8)
  await writeEvent(stream, { type: 'content_block_stop', index: 5 })

  // message_delta with end_turn
  await writeEvent(stream, {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn' },
    usage: { output_tokens: 950 },
  })
  await writeEvent(stream, { type: 'message_stop' })
}

chatRoute.post('/chat/stream', async (c) => {
  const body = await c.req.json()

  return streamSSE(c, async (stream) => {
    if (MOCK_MODE) {
      await streamMock(stream)
      return
    }

    try {
      const client = getClient()
      const requestBody: any = {
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 16384,
        messages: body.messages,
        stream: true,
      }
      if (body.thinking) requestBody.thinking = body.thinking
      if (body.system) requestBody.system = body.system

      const response = client.messages.stream(requestBody)
      for await (const event of response) {
        await writeEvent(stream, event)
      }
    } catch (err: any) {
      await writeEvent(stream, {
        type: 'error',
        error: { message: err.message || 'Unknown error' },
      })
    }
  })
})
