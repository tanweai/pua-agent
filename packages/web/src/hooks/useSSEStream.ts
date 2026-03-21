import { useRef, useCallback } from 'react'
import type { StreamEvent } from '../types/stream'

interface StreamOptions {
  model: string
  messages: Array<{ role: string; content: any }>
  thinkingEnabled: boolean
  thinkingBudget: number
  useAgent?: boolean
  onEvent: (event: StreamEvent) => void
  onError: (error: Error) => void
  onComplete: () => void
}

export function useSSEStream() {
  const abortRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (options: StreamOptions) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Choose endpoint: Agent SDK or direct API
    const isAgent = options.useAgent
    const endpoint = isAgent ? '/api/agent/stream' : '/api/chat/stream'

    const body: any = isAgent
      ? {
          prompt: options.messages[options.messages.length - 1]?.content || '',
          model: options.model,
          tools: ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch'],
          thinkingEnabled: options.thinkingEnabled,
        }
      : {
          model: options.model,
          messages: options.messages,
          max_tokens: 16384,
          stream: true,
          ...(options.thinkingEnabled && { thinking: { type: 'enabled', budget_tokens: options.thinkingBudget } }),
        }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) continue
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const event: StreamEvent = JSON.parse(data)
              options.onEvent(event)
            } catch { /* skip malformed */ }
          }
        }
      }

      options.onComplete()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        options.onError(err as Error)
      }
    }
  }, [])

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  return { startStream, stopStream }
}
