import type { Message } from './message'

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  thinkingEnabled: boolean
  thinkingBudget: number
  createdAt: number
  updatedAt: number
}

export interface ModelOption {
  id: string
  name: string
  displayName: string
  hasThinking: boolean
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', displayName: 'Haiku 4.5', hasThinking: false },
  { id: 'claude-sonnet-4-6-20250514', name: 'Sonnet 4.6', displayName: 'Sonnet 4.6', hasThinking: false },
  { id: 'claude-sonnet-4-6-20250514', name: 'Sonnet 4.6 Extended', displayName: 'Sonnet 4.6 Extended', hasThinking: true },
  { id: 'claude-opus-4-6-20250514', name: 'Opus 4.6 Extended', displayName: 'Opus 4.6 Extended', hasThinking: true },
  { id: 'claude-opus-4-6-20250514', name: 'Opus 4.6', displayName: 'Opus 4.6', hasThinking: false },
]
