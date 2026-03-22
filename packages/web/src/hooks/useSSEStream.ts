import { useRef, useCallback } from 'react'
import type { StreamEvent } from '../types/stream'

interface StreamOptions {
  model: string
  messages: Array<{ role: string; content: any }>
  thinkingEnabled: boolean
  thinkingBudget: number
  useAgent?: boolean
  agentSessionId?: string  // For multi-turn resume
  agentPromptOverride?: string  // Override prompt for agent mode (e.g. with image paths)
  customAgents?: Record<string, { description: string; prompt?: string; tools?: string[] }>
  puaMode?: boolean
  onEvent: (event: StreamEvent | any) => void
  onError: (error: Error) => void
  onComplete: () => void
}

export function useSSEStream() {
  const abortRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (options: StreamOptions) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const isAgent = options.useAgent
    const endpoint = isAgent ? '/api/agent/stream' : '/api/chat/stream'

    // Agent mode: use override prompt if available, otherwise extract from last user message
    const lastUserMsg = options.messages.filter(m => m.role === 'user').pop()
    const prompt = options.agentPromptOverride || (typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '')

    const body: any = isAgent
      ? {
          prompt,
          model: options.model,
          tools: ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch', 'Agent', 'Skill'],
          ...(options.agentSessionId && { sessionId: options.agentSessionId }),
          ...(options.customAgents && Object.keys(options.customAgents).length > 0 && { agents: options.customAgents }),
          ...(options.puaMode && { puaMode: true }),
        }
      : {
          model: options.model,
          messages: options.messages,
          max_tokens: 16384,
          stream: true,
          ...(options.thinkingEnabled && { thinking: { type: 'enabled', budget_tokens: options.thinkingBudget } }),
        }

    try {
      const token = localStorage.getItem('pua-agent-token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
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
              const event = JSON.parse(data)
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
