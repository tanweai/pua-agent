// Content block types — union type for each block in a message

export interface ThinkingBlock {
  type: 'thinking'
  text: string
  signature: string
  status: 'streaming' | 'done'
  summary: string
  isExpanded: boolean
}

export interface TextBlock {
  type: 'text'
  text: string
  status: 'streaming' | 'done'
}

export interface ToolUseBlock {
  type: 'tool_use'
  toolId: string
  toolName: string
  input: Record<string, any>
  inputBuffer: string
  status: 'streaming_input' | 'executing' | 'done'
}

export interface ToolResultBlock {
  type: 'tool_result'
  toolId: string
  toolName: string
  content: any
  status: 'done'
}

export type ContentBlock = ThinkingBlock | TextBlock | ToolUseBlock | ToolResultBlock

export interface TaskProgress {
  toolUseId: string
  status: 'started' | 'running' | 'completed'
  toolUseCount?: number
  durationMs?: number
  summary?: string
}

export interface AgentResult {
  subtype: string  // 'success' | 'error_max_turns' | 'error_max_budget_usd' etc.
  totalCostUsd?: number
  totalInputTokens?: number
  totalOutputTokens?: number
  numTurns?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content?: string
  blocks: ContentBlock[]
  toolResults: Record<string, ToolResultBlock>
  taskProgress?: Record<string, TaskProgress>
  agentResult?: AgentResult
  model?: string
  isStreaming: boolean
  stopReason?: string
  usage?: { inputTokens: number; outputTokens: number }
  createdAt: number
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  content?: string
}
