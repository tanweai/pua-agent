import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { query } from '@anthropic-ai/claude-agent-sdk'

export const agentRoute = new Hono()

// ZhiPu API credentials — passed via env to Agent SDK subprocess
const ZHIPU_ENV = {
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://open.bigmodel.cn/api/anthropic',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
}

async function writeEvent(stream: any, event: object) {
  await stream.writeSSE({
    event: 'message',
    data: JSON.stringify(event),
  })
}

let blockIndex = 0

agentRoute.post('/agent/stream', async (c) => {
  const body = await c.req.json<{
    prompt: string
    model?: string
    tools?: string[]
    thinkingEnabled?: boolean
  }>()

  return streamSSE(c, async (stream) => {
    blockIndex = 0

    try {
      // Emit message_start
      const msgId = 'msg_agent_' + Date.now()
      await writeEvent(stream, {
        type: 'message_start',
        message: {
          id: msgId, type: 'message', role: 'assistant',
          model: body.model || 'glm-4.7',
          content: [], stop_reason: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      })

      const allowedTools = body.tools || ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch']

      console.log(`[Agent] Starting query: "${body.prompt.slice(0, 50)}..." tools=${allowedTools.join(',')}`)

      for await (const message of query({
        prompt: body.prompt,
        options: {
          model: body.model || 'claude-sonnet-4-6',
          allowedTools,
          maxTurns: 20,
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          env: ZHIPU_ENV,
          cwd: process.cwd(),
        },
      })) {
        // System messages — session init, progress
        if (message.type === 'system') {
          if (message.subtype === 'init') {
            console.log(`[Agent] Session started: ${message.session_id}`)
            // Emit as a thinking block — "Agent initializing..."
            await writeEvent(stream, {
              type: 'content_block_start', index: blockIndex,
              content_block: { type: 'thinking', thinking: '', signature: '' },
            })
            await writeEvent(stream, {
              type: 'content_block_delta', index: blockIndex,
              delta: { type: 'thinking_delta', thinking: `Agent session started (${message.session_id})` },
            })
            await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
            blockIndex++
          }
        }

        // Assistant messages — contain content blocks
        if (message.type === 'assistant') {
          // The assistant message may contain content blocks
          if (message.content) {
            for (const block of message.content) {
              if (block.type === 'text' && block.text) {
                await writeEvent(stream, {
                  type: 'content_block_start', index: blockIndex,
                  content_block: { type: 'text', text: '' },
                })
                // Stream the text in chunks for smooth rendering
                const text = block.text
                for (let i = 0; i < text.length; i += 8) {
                  await writeEvent(stream, {
                    type: 'content_block_delta', index: blockIndex,
                    delta: { type: 'text_delta', text: text.slice(i, i + 8) },
                  })
                }
                await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
                blockIndex++
              }

              if (block.type === 'tool_use') {
                await writeEvent(stream, {
                  type: 'content_block_start', index: blockIndex,
                  content_block: { type: 'tool_use', id: block.id || `tool_${blockIndex}`, name: block.name || 'unknown', input: {} },
                })
                await writeEvent(stream, {
                  type: 'content_block_delta', index: blockIndex,
                  delta: { type: 'input_json_delta', partial_json: JSON.stringify(block.input || {}) },
                })
                await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
                blockIndex++
              }

              if (block.type === 'thinking' && block.thinking) {
                await writeEvent(stream, {
                  type: 'content_block_start', index: blockIndex,
                  content_block: { type: 'thinking', thinking: '', signature: '' },
                })
                const thinkText = block.thinking
                for (let i = 0; i < thinkText.length; i += 10) {
                  await writeEvent(stream, {
                    type: 'content_block_delta', index: blockIndex,
                    delta: { type: 'thinking_delta', thinking: thinkText.slice(i, i + 10) },
                  })
                }
                if (block.signature) {
                  await writeEvent(stream, {
                    type: 'content_block_delta', index: blockIndex,
                    delta: { type: 'signature_delta', signature: block.signature },
                  })
                }
                await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
                blockIndex++
              }
            }
          }
        }

        // Result message — final output
        if ('result' in message) {
          const resultText = message.result || ''
          if (resultText) {
            await writeEvent(stream, {
              type: 'content_block_start', index: blockIndex,
              content_block: { type: 'text', text: '' },
            })
            for (let i = 0; i < resultText.length; i += 6) {
              await writeEvent(stream, {
                type: 'content_block_delta', index: blockIndex,
                delta: { type: 'text_delta', text: resultText.slice(i, i + 6) },
              })
            }
            await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
            blockIndex++
          }

          // End message
          await writeEvent(stream, {
            type: 'message_delta',
            delta: { stop_reason: message.stop_reason || 'end_turn' },
            usage: { output_tokens: blockIndex * 100 },
          })
          await writeEvent(stream, { type: 'message_stop' })
        }
      }
    } catch (err: any) {
      console.error('[Agent Error]', err.message)

      // If we haven't sent message_stop yet, send error
      await writeEvent(stream, {
        type: 'content_block_start', index: blockIndex,
        content_block: { type: 'text', text: '' },
      })
      await writeEvent(stream, {
        type: 'content_block_delta', index: blockIndex,
        delta: { type: 'text_delta', text: `**Error:** ${err.message}` },
      })
      await writeEvent(stream, { type: 'content_block_stop', index: blockIndex })
      await writeEvent(stream, {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn' },
        usage: { output_tokens: 0 },
      })
      await writeEvent(stream, { type: 'message_stop' })
    }
  })
})
