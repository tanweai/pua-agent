import { uuid } from '../../utils/uuid'
import { useCallback, useRef, useEffect, useState } from 'react'
import { MessageList } from './MessageList'
import { InputArea } from '../input/InputArea'
import { ErrorBanner } from '../ui/ErrorBanner'
import { useSSEStream } from '../../hooks/useSSEStream'
import { useStreamReducer } from '../../hooks/useStreamReducer'
import type { Message } from '../../types/message'
import type { ModelOption } from '../../types/conversation'
import type { StreamEvent } from '../../types/stream'

interface Props {
  messages: Message[]
  model: ModelOption
  customAgents?: Record<string, { description: string; prompt?: string; tools?: string[] }>
  puaMode?: boolean
  onAddMessage: (msg: Message) => void
  onUpdateLastMessage: (msg: Message) => void
  onModelChange: (model: ModelOption) => void
  onPuaModeChange?: (enabled: boolean) => void
  onEnsureConversation: () => void
  onToggleThinking: (messageIndex: number, blockIndex: number) => void
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function ChatView({
  messages, model, customAgents, puaMode, onAddMessage, onUpdateLastMessage, onModelChange,
  onPuaModeChange, onEnsureConversation, onToggleThinking, onShowToast,
}: Props) {
  const { startStream, stopStream } = useSSEStream()
  const { streamingMessage, dispatch, toggleThinking, reset } = useStreamReducer()
  const wasStreamingRef = useRef(false)
  const agentSessionRef = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prefill, setPrefill] = useState('')

  const isStreaming = streamingMessage.isStreaming

  // Persist the streaming message when it finishes
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && streamingMessage.id) {
      onAddMessage({ ...streamingMessage })
      reset()
    }
    wasStreamingRef.current = isStreaming
  }, [isStreaming, streamingMessage, onAddMessage, reset])

  const handleSend = useCallback(async (content: string, images?: { name: string; type: string; data: string }[]) => {
    setError(null)
    onEnsureConversation()

    // If images attached, upload them to server and append paths to prompt
    let finalContent = content
    const uploadedPaths: string[] = []
    if (images && images.length > 0) {
      for (const img of images) {
        try {
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: img.name, type: img.type, data: img.data }),
          })
          if (res.ok) {
            const { path } = await res.json()
            uploadedPaths.push(path)
          }
        } catch { /* skip failed uploads */ }
      }
      if (uploadedPaths.length > 0) {
        finalContent += `\n\n[用户上传了 ${uploadedPaths.length} 张图片，文件路径: ${uploadedPaths.join(', ')}。请用 Read 工具查看图片。]`
      }
    }

    const userMsg: Message = {
      id: uuid(),
      role: 'user',
      content,  // Display original text (no image paths) in UI
      blocks: [],
      toolResults: {},
      isStreaming: false,
      createdAt: Date.now(),
      attachments: uploadedPaths.length > 0
        ? uploadedPaths.map((p, i) => ({ id: `img-${i}`, name: images![i].name, type: images![i].type, size: 0 }))
        : undefined,
    }
    onAddMessage(userMsg)

    // For API: use finalContent which includes image paths
    const apiMessages = [...messages, userMsg].map((m) => {
      if (m.role === 'user') {
        // Use finalContent for the latest user message (with image paths)
        if (m.id === userMsg.id) return { role: 'user' as const, content: finalContent }
        return { role: 'user' as const, content: m.content || '' }
      }
      const c: any[] = m.blocks
        .filter((b) => b.type === 'text' || b.type === 'thinking')
        .map((b) => {
          if (b.type === 'thinking') return { type: 'thinking', thinking: b.text, signature: b.signature }
          return { type: 'text', text: b.text }
        })
      return { role: 'assistant' as const, content: c.length ? c : '' }
    })

    reset()

    // Agent mode: track turns to avoid resetting on each message_start
    let agentTurnCount = 0
    let agentBlockOffset = 0
    let agentMaxBlockIdx = -1  // Track highest block index used

    startStream({
      model: model.id,
      messages: apiMessages,
      thinkingEnabled: model.hasThinking,
      thinkingBudget: 10000,
      useAgent: model.useAgent,
      agentSessionId: agentSessionRef.current || undefined,
      agentPromptOverride: uploadedPaths.length > 0 ? finalContent : undefined,
      customAgents,
      puaMode,
      onEvent: (event: StreamEvent | any) => {
        const isAgent = model.useAgent

        switch (event.type) {
          case 'session_init':
            agentSessionRef.current = event.session_id
            break

          case 'message_start':
            if (isAgent) {
              agentTurnCount++
              if (agentTurnCount === 1) {
                // First turn: create the message
                dispatch({ type: 'MESSAGE_START', id: event.message.id, model: event.message.model, usage: event.message.usage })
              }
              // Subsequent turns: just continue accumulating blocks (don't reset)
            } else {
              dispatch({ type: 'MESSAGE_START', id: event.message.id, model: event.message.model, usage: event.message.usage })
            }
            break

          case 'content_block_start': {
            const idx = isAgent ? event.index + agentBlockOffset : event.index
            if (idx > agentMaxBlockIdx) agentMaxBlockIdx = idx
            dispatch({ type: 'BLOCK_START', index: idx, block: event.content_block })
            break
          }

          case 'content_block_delta': {
            const idx = isAgent ? event.index + agentBlockOffset : event.index
            dispatch({ type: 'BLOCK_DELTA', index: idx, delta: event.delta })
            break
          }

          case 'content_block_stop': {
            const idx = isAgent ? event.index + agentBlockOffset : event.index
            dispatch({ type: 'BLOCK_STOP', index: idx })
            break
          }

          case 'message_delta':
            if (isAgent) {
              // Don't set stop_reason in Agent mode — wait for result
            } else {
              dispatch({ type: 'MESSAGE_DELTA', stopReason: event.delta.stop_reason, outputTokens: event.usage.output_tokens })
            }
            break

          case 'message_stop':
            if (isAgent) {
              // Agent mode: DON'T end. Set offset = highest used index + 1
              agentBlockOffset = agentMaxBlockIdx + 1
            } else {
              dispatch({ type: 'MESSAGE_STOP' })
            }
            break

          case 'tool_result':
            dispatch({ type: 'TOOL_RESULT', toolId: event.tool_use_id, toolName: event.tool_name, content: event.content })
            break

          case 'task_started':
            dispatch({ type: 'TASK_STARTED', toolUseId: event.tool_use_id })
            break

          case 'task_progress':
            dispatch({ type: 'TASK_PROGRESS', toolUseId: event.tool_use_id, toolUseCount: event.tool_use_count, durationMs: event.duration_ms, summary: event.summary })
            break

          case 'task_notification':
            dispatch({ type: 'TASK_NOTIFICATION', toolUseId: event.tool_use_id })
            break

          case 'agent_result':
            dispatch({
              type: 'AGENT_RESULT',
              subtype: event.subtype,
              totalCostUsd: event.total_cost_usd,
              totalInputTokens: event.total_input_tokens,
              totalOutputTokens: event.total_output_tokens,
              numTurns: event.num_turns,
            })
            break

          case 'rate_limit':
            onShowToast(`Rate limited — resets at ${new Date(event.resets_at).toLocaleTimeString()}`, 'error')
            break
        }
      },
      onError: (err) => {
        setError(err.message)
        dispatch({ type: 'ERROR', error: err.message })
      },
      onComplete: () => {
        // In Agent mode, MESSAGE_STOP is deferred until stream ends
        if (model.useAgent) {
          dispatch({ type: 'MESSAGE_STOP' })
        }
      },
    })
  }, [messages, model, startStream, dispatch, reset, onAddMessage, onEnsureConversation])

  const handleStop = useCallback(() => {
    stopStream()
    dispatch({ type: 'MESSAGE_STOP' })
  }, [stopStream, dispatch])

  const handleQuickAction = useCallback((text: string) => {
    setPrefill(text)
  }, [])

  const handleClearPrefill = useCallback(() => {
    setPrefill('')
  }, [])

  const allMessages = isStreaming || streamingMessage.id
    ? [...messages, streamingMessage]
    : messages

  const handleToggleThinking = useCallback((messageIndex: number, blockIndex: number) => {
    // If it's the currently streaming message (last in allMessages)
    if (streamingMessage.id && messageIndex === allMessages.length - 1) {
      toggleThinking(blockIndex)
    } else {
      // Persisted message — delegate to parent
      onToggleThinking(messageIndex, blockIndex)
    }
  }, [allMessages.length, streamingMessage.id, toggleThinking, onToggleThinking])

  const hasMessages = allMessages.length > 0

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <MessageList
        messages={allMessages}
        model={model}
        onToggleThinking={handleToggleThinking}
        onQuickAction={handleQuickAction}
        onShowToast={(msg) => onShowToast(msg, 'success')}
        onSendPrompt={handleSend}
        onModelChange={onModelChange}
      />
      {error && <ErrorBanner message={error} onRetry={() => { setError(null) }} />}
      {/* Only show bottom InputArea after first message */}
      {hasMessages && (
        <InputArea
          isStreaming={isStreaming}
          model={model}
          puaMode={puaMode}
          onSend={handleSend}
          onStop={handleStop}
          onModelChange={onModelChange}
          onPuaModeChange={onPuaModeChange}
          prefill={prefill}
          onClearPrefill={handleClearPrefill}
          onShowToast={onShowToast}
        />
      )}
    </div>
  )
}
