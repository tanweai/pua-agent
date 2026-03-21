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
  onAddMessage: (msg: Message) => void
  onUpdateLastMessage: (msg: Message) => void
  onModelChange: (model: ModelOption) => void
  onEnsureConversation: () => void
  onToggleThinking: (messageIndex: number, blockIndex: number) => void
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function ChatView({
  messages, model, onAddMessage, onUpdateLastMessage, onModelChange,
  onEnsureConversation, onToggleThinking, onShowToast,
}: Props) {
  const { startStream, stopStream } = useSSEStream()
  const { streamingMessage, dispatch, toggleThinking, reset } = useStreamReducer()
  const wasStreamingRef = useRef(false)
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

  const handleSend = useCallback((content: string) => {
    setError(null)
    onEnsureConversation()

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      blocks: [],
      toolResults: {},
      isStreaming: false,
      createdAt: Date.now(),
    }
    onAddMessage(userMsg)

    const apiMessages = [...messages, userMsg].map((m) => {
      if (m.role === 'user') return { role: 'user' as const, content: m.content || '' }
      const c: any[] = m.blocks
        .filter((b) => b.type === 'text' || b.type === 'thinking')
        .map((b) => {
          if (b.type === 'thinking') return { type: 'thinking', thinking: b.text, signature: b.signature }
          return { type: 'text', text: b.text }
        })
      return { role: 'assistant' as const, content: c.length ? c : '' }
    })

    reset()

    startStream({
      model: model.id,
      messages: apiMessages,
      thinkingEnabled: model.hasThinking,
      thinkingBudget: 10000,
      onEvent: (event: StreamEvent | any) => {
        switch (event.type) {
          case 'message_start':
            dispatch({ type: 'MESSAGE_START', id: event.message.id, model: event.message.model, usage: event.message.usage })
            break
          case 'content_block_start':
            dispatch({ type: 'BLOCK_START', index: event.index, block: event.content_block })
            break
          case 'content_block_delta':
            dispatch({ type: 'BLOCK_DELTA', index: event.index, delta: event.delta })
            break
          case 'content_block_stop':
            dispatch({ type: 'BLOCK_STOP', index: event.index })
            break
          case 'message_delta':
            dispatch({ type: 'MESSAGE_DELTA', stopReason: event.delta.stop_reason, outputTokens: event.usage.output_tokens })
            break
          case 'message_stop':
            dispatch({ type: 'MESSAGE_STOP' })
            break
          case 'tool_result':
            dispatch({ type: 'TOOL_RESULT', toolId: event.tool_use_id, toolName: event.tool_name, content: event.content })
            break
        }
      },
      onError: (err) => {
        setError(err.message)
        dispatch({ type: 'ERROR', error: err.message })
      },
      onComplete: () => {},
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

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <MessageList
        messages={allMessages}
        onToggleThinking={handleToggleThinking}
        onQuickAction={handleQuickAction}
        onShowToast={(msg) => onShowToast(msg, 'success')}
        onSendPrompt={handleSend}
      />
      {error && <ErrorBanner message={error} onRetry={() => { setError(null) }} />}
      <InputArea
        isStreaming={isStreaming}
        model={model}
        onSend={handleSend}
        onStop={handleStop}
        onModelChange={onModelChange}
        prefill={prefill}
        onClearPrefill={handleClearPrefill}
        onShowToast={onShowToast}
      />
    </div>
  )
}
