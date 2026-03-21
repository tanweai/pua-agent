import type { StreamEvent } from '../types/stream'

export function parseSSELine(line: string): StreamEvent | null {
  if (!line.startsWith('data: ')) return null
  const data = line.slice(6)
  if (data === '[DONE]') return null
  try {
    return JSON.parse(data) as StreamEvent
  } catch {
    return null
  }
}
