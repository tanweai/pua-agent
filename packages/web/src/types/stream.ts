// SSE event types matching Anthropic Messages API Streaming protocol

export interface MessageStartEvent {
  type: 'message_start'
  message: {
    id: string
    type: 'message'
    role: 'assistant'
    model: string
    content: []
    stop_reason: null
    usage: { input_tokens: number; output_tokens: number }
  }
}

export interface ContentBlockStartEvent {
  type: 'content_block_start'
  index: number
  content_block:
    | { type: 'thinking'; thinking: ''; signature: '' }
    | { type: 'text'; text: '' }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, never> }
}

export interface ContentBlockDeltaEvent {
  type: 'content_block_delta'
  index: number
  delta:
    | { type: 'thinking_delta'; thinking: string }
    | { type: 'text_delta'; text: string }
    | { type: 'input_json_delta'; partial_json: string }
    | { type: 'signature_delta'; signature: string }
}

export interface ContentBlockStopEvent {
  type: 'content_block_stop'
  index: number
}

export interface MessageDeltaEvent {
  type: 'message_delta'
  delta: { stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' }
  usage: { output_tokens: number }
}

export interface MessageStopEvent {
  type: 'message_stop'
}

export interface PingEvent {
  type: 'ping'
}

// Agent SDK task events
export interface TaskStartedEvent {
  type: 'task_started'
  tool_use_id: string
  session_id: string
}

export interface TaskProgressEvent {
  type: 'task_progress'
  tool_use_id: string
  usage?: { input_tokens: number; output_tokens: number }
  tool_use_count?: number
  duration_ms?: number
  summary?: string
}

export interface TaskNotificationEvent {
  type: 'task_notification'
  tool_use_id: string
  session_id?: string
  message?: string
}

export type StreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | PingEvent
  | TaskStartedEvent
  | TaskProgressEvent
  | TaskNotificationEvent
