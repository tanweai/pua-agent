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
  glmModel: string
  hasThinking: boolean
  useAgent?: boolean
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-haiku-4-5', name: 'Haiku 4.5', displayName: 'GLM-4.5-Air', glmModel: 'GLM-4.5-Air', hasThinking: false },
  { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6', displayName: 'GLM-4.7', glmModel: 'GLM-4.7', hasThinking: false },
  { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6 Extended', displayName: 'GLM-4.7 Extended', glmModel: 'GLM-4.7', hasThinking: true },
  { id: 'claude-opus-4-6', name: 'Opus 4.6 Extended', displayName: 'GLM-5 Extended', glmModel: 'GLM-5', hasThinking: true },
  { id: 'claude-opus-4-6', name: 'Opus 4.6', displayName: 'GLM-5', glmModel: 'GLM-5', hasThinking: false },
  { id: 'claude-sonnet-4-6', name: 'Agent 4.7', displayName: 'Agent (GLM-4.7)', glmModel: 'GLM-4.7', hasThinking: false, useAgent: true },
  { id: 'claude-opus-4-6', name: 'Agent 5', displayName: 'Agent (GLM-5)', glmModel: 'GLM-5', hasThinking: false, useAgent: true },
]
