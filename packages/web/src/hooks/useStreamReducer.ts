import { useReducer, useCallback } from 'react'
import type { ContentBlock, ThinkingBlock, TextBlock, ToolUseBlock, ToolResultBlock, TaskProgress, AgentResult, Message } from '../types/message'
import type { ContentBlockStartEvent } from '../types/stream'
import { generateThinkingSummary } from '../utils/generateSummary'

// Actions
type Action =
  | { type: 'MESSAGE_START'; id: string; model: string; usage: { input_tokens: number; output_tokens: number } }
  | { type: 'BLOCK_START'; index: number; block: ContentBlockStartEvent['content_block'] }
  | { type: 'BLOCK_DELTA'; index: number; delta: any }
  | { type: 'BLOCK_STOP'; index: number }
  | { type: 'MESSAGE_DELTA'; stopReason: string; outputTokens: number }
  | { type: 'MESSAGE_STOP' }
  | { type: 'TOOL_RESULT'; toolId: string; toolName: string; content: any }
  | { type: 'TASK_STARTED'; toolUseId: string }
  | { type: 'TASK_PROGRESS'; toolUseId: string; toolUseCount?: number; durationMs?: number; summary?: string }
  | { type: 'TASK_NOTIFICATION'; toolUseId: string }
  | { type: 'AGENT_RESULT'; subtype: string; totalCostUsd?: number; totalInputTokens?: number; totalOutputTokens?: number; numTurns?: number }
  | { type: 'TOGGLE_THINKING'; index: number }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }

function tryParseJSON(str: string): Record<string, any> | null {
  try { return JSON.parse(str) } catch { return null }
}

function createBlock(raw: ContentBlockStartEvent['content_block']): ContentBlock {
  switch (raw.type) {
    case 'thinking':
      return { type: 'thinking', text: '', signature: '', status: 'streaming', summary: '', isExpanded: true }
    case 'text':
      return { type: 'text', text: '', status: 'streaming' }
    case 'tool_use':
      return { type: 'tool_use', toolId: raw.id, toolName: raw.name, input: {}, inputBuffer: '', status: 'streaming_input' }
  }
}

const EMPTY_MESSAGE: Message = {
  id: '',
  role: 'assistant',
  blocks: [],
  toolResults: {},
  taskProgress: {},
  isStreaming: false,
  createdAt: 0,
}

function streamReducer(state: Message, action: Action): Message {
  switch (action.type) {
    case 'MESSAGE_START':
      return {
        id: action.id,
        role: 'assistant',
        model: action.model,
        blocks: [],
        toolResults: {},
        isStreaming: true,
        usage: { inputTokens: action.usage.input_tokens, outputTokens: action.usage.output_tokens },
        createdAt: Date.now(),
      }

    case 'BLOCK_START': {
      const blocks = [...state.blocks]
      blocks[action.index] = createBlock(action.block)
      return { ...state, blocks }
    }

    case 'BLOCK_DELTA': {
      const blocks = [...state.blocks]
      const block = blocks[action.index]
      if (!block) return state
      const delta = action.delta

      if (delta.type === 'thinking_delta' && block.type === 'thinking') {
        blocks[action.index] = { ...block, text: block.text + delta.thinking }
      } else if (delta.type === 'text_delta' && block.type === 'text') {
        blocks[action.index] = { ...block, text: block.text + delta.text }
      } else if (delta.type === 'input_json_delta' && block.type === 'tool_use') {
        const newBuffer = block.inputBuffer + delta.partial_json
        blocks[action.index] = { ...block, inputBuffer: newBuffer, input: tryParseJSON(newBuffer) ?? block.input }
      } else if (delta.type === 'signature_delta' && block.type === 'thinking') {
        blocks[action.index] = { ...block, signature: block.signature + delta.signature }
      }

      return { ...state, blocks }
    }

    case 'BLOCK_STOP': {
      const blocks = [...state.blocks]
      const block = blocks[action.index]
      if (!block) return state

      if (block.type === 'thinking') {
        blocks[action.index] = { ...block, status: 'done', isExpanded: false, summary: generateThinkingSummary(block.text) }
      } else if (block.type === 'text') {
        blocks[action.index] = { ...block, status: 'done' }
      } else if (block.type === 'tool_use') {
        blocks[action.index] = { ...block, status: 'executing' }
      }
      return { ...state, blocks }
    }

    case 'TOOL_RESULT': {
      const resultBlock: ToolResultBlock = {
        type: 'tool_result', toolId: action.toolId, toolName: action.toolName,
        content: action.content, status: 'done',
      }
      const blocks = state.blocks.map((b) =>
        b.type === 'tool_use' && b.toolId === action.toolId ? { ...b, status: 'done' as const } : b,
      )
      return {
        ...state,
        blocks,
        toolResults: { ...state.toolResults, [action.toolId]: resultBlock },
      }
    }

    case 'TASK_STARTED': {
      const tp: TaskProgress = { toolUseId: action.toolUseId, status: 'started' }
      return { ...state, taskProgress: { ...state.taskProgress, [action.toolUseId]: tp } }
    }

    case 'TASK_PROGRESS': {
      const existing = state.taskProgress?.[action.toolUseId]
      const tp: TaskProgress = {
        toolUseId: action.toolUseId,
        status: 'running',
        toolUseCount: action.toolUseCount ?? existing?.toolUseCount,
        durationMs: action.durationMs ?? existing?.durationMs,
        summary: action.summary ?? existing?.summary,
      }
      return { ...state, taskProgress: { ...state.taskProgress, [action.toolUseId]: tp } }
    }

    case 'TASK_NOTIFICATION': {
      const existing = state.taskProgress?.[action.toolUseId]
      if (existing) {
        const tp: TaskProgress = { ...existing, status: 'completed' }
        return { ...state, taskProgress: { ...state.taskProgress, [action.toolUseId]: tp } }
      }
      return state
    }

    case 'AGENT_RESULT': {
      const ar: AgentResult = {
        subtype: action.subtype,
        totalCostUsd: action.totalCostUsd,
        totalInputTokens: action.totalInputTokens,
        totalOutputTokens: action.totalOutputTokens,
        numTurns: action.numTurns,
      }
      return { ...state, agentResult: ar }
    }

    case 'MESSAGE_DELTA':
      return {
        ...state,
        stopReason: action.stopReason,
        usage: { ...state.usage!, outputTokens: action.outputTokens },
      }

    case 'MESSAGE_STOP':
      return { ...state, isStreaming: false }

    case 'TOGGLE_THINKING': {
      const blocks = [...state.blocks]
      const block = blocks[action.index]
      if (block?.type === 'thinking') {
        blocks[action.index] = { ...block, isExpanded: !block.isExpanded }
      }
      return { ...state, blocks }
    }

    case 'ERROR':
      return { ...state, isStreaming: false }

    case 'RESET':
      return EMPTY_MESSAGE

    default:
      return state
  }
}

export function useStreamReducer() {
  const [streamingMessage, dispatch] = useReducer(streamReducer, EMPTY_MESSAGE)

  const toggleThinking = useCallback((index: number) => {
    dispatch({ type: 'TOGGLE_THINKING', index })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return { streamingMessage, dispatch, toggleThinking, reset }
}
