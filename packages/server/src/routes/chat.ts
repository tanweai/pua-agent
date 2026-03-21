import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getClient } from '../lib/anthropic.js'

export const chatRoute = new Hono()

async function writeEvent(stream: any, event: object) {
  await stream.writeSSE({
    event: 'message',
    data: JSON.stringify(event),
  })
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ========== Real API Mode ==========
async function streamReal(stream: any, body: any) {
  const client = getClient()

  const requestBody: any = {
    model: body.model || 'claude-sonnet-4-6',
    max_tokens: body.max_tokens || 16384,
    messages: body.messages,
    stream: true,
  }

  if (body.thinking) {
    requestBody.thinking = body.thinking
  }

  if (body.system) {
    requestBody.system = body.system
  }

  // Add web_search tool if not already present
  if (body.tools?.length) {
    requestBody.tools = body.tools
  }

  console.log(`[API] Streaming request to ${process.env.ANTHROPIC_BASE_URL || 'api.anthropic.com'} model=${requestBody.model}`)

  const response = client.messages.stream(requestBody)

  for await (const event of response) {
    await writeEvent(stream, event)
  }
}

// ========== Mock Mode (fallback when no API key) ==========
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

  await writeEvent(stream, {
    type: 'message_start',
    message: {
      id: msgId, type: 'message', role: 'assistant',
      model: 'glm-5-mock', content: [], stop_reason: null,
      usage: { input_tokens: 150, output_tokens: 0 },
    },
  })

  // Block 0: Thinking
  await writeEvent(stream, { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } })
  await streamChunked(stream, 0, 'thinking_delta', 'thinking',
    `The user wants to test the chat interface. Let me analyze their question and provide a comprehensive response with multiple content blocks to demonstrate the full UI capabilities.`, 8, 8)
  await writeEvent(stream, { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'EqQBCgIYAh...' } })
  await writeEvent(stream, { type: 'content_block_stop', index: 0 })
  await delay(200)

  // Block 1: Text
  await writeEvent(stream, { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } })
  await streamChunked(stream, 1, 'text_delta', 'text', `I'm running in **mock mode** because no API key is configured.\n\nTo connect to the real ZhiPu GLM API, add your API key to \`packages/server/.env\`:\n\n\`\`\`bash\nANTHROPIC_API_KEY=your-key-here\nANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic\n\`\`\`\n\nThen restart the server. The model mapping is:\n\n| Claude Model | ZhiPu Model |\n|---|---|\n| claude-opus-4-6 | GLM-5 |\n| claude-sonnet-4-6 | GLM-4.7 |\n| claude-haiku-4-5 | GLM-4.5-Air |`)
  await writeEvent(stream, { type: 'content_block_stop', index: 1 })

  await writeEvent(stream, { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 200 } })
  await writeEvent(stream, { type: 'message_stop' })
}

// ========== Route Handler ==========
chatRoute.post('/chat/stream', async (c) => {
  const body = await c.req.json()
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  return streamSSE(c, async (stream) => {
    if (!hasApiKey) {
      await streamMock(stream)
      return
    }

    try {
      await streamReal(stream, body)
    } catch (err: any) {
      console.error('[API Error]', err.message)
      await writeEvent(stream, {
        type: 'error',
        error: { type: 'api_error', message: err.message || 'Unknown error' },
      })
    }
  })
})
