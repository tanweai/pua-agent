import { useEffect, useRef, useCallback, useState } from 'react'
import { UserMessage } from './UserMessage'
import { AssistantMessage } from './AssistantMessage'
import { EmptyState } from './EmptyState'
import { ScrollToBottom } from '../ui/ScrollToBottom'
import type { Message } from '../../types/message'
import type { ModelOption } from '../../types/conversation'

interface Props {
  messages: Message[]
  model: ModelOption
  onToggleThinking: (messageIndex: number, blockIndex: number) => void
  onQuickAction?: (text: string) => void
  onShowToast?: (msg: string) => void
  onSendPrompt?: (text: string) => void
  onModelChange?: (model: ModelOption) => void
}

export function MessageList({ messages, model, onToggleThinking, onQuickAction, onShowToast, onSendPrompt, onModelChange }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const isUserScrolledUp = useRef(false)
  const lastScrollTop = useRef(0)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const distFromBottom = scrollHeight - scrollTop - clientHeight

    if (scrollTop < lastScrollTop.current && distFromBottom > 100) {
      isUserScrolledUp.current = true
    }
    if (distFromBottom < 50) {
      isUserScrolledUp.current = false
    }

    setShowScrollBtn(distFromBottom > 150)
    lastScrollTop.current = scrollTop
  }, [])

  useEffect(() => {
    if (!isUserScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const scrollToBottom = useCallback(() => {
    isUserScrolledUp.current = false
    setShowScrollBtn(false)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  if (messages.length === 0) {
    return (
      <EmptyState
        model={model}
        onSend={onSendPrompt || (() => {})}
        onModelChange={onModelChange || (() => {})}
        onShowToast={(msg) => onShowToast?.(msg)}
      />
    )
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-6 relative">
      <div className="space-y-6">
        {messages.map((msg, i) => (
          msg.role === 'user' ? (
            <UserMessage key={msg.id} message={msg} />
          ) : (
            <AssistantMessage
              key={msg.id}
              message={msg}
              onToggleThinking={(blockIndex) => onToggleThinking(i, blockIndex)}
              onShowToast={onShowToast}
              onSendPrompt={onSendPrompt}
            />
          )
        ))}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <div className="sticky bottom-4 flex justify-center pointer-events-none">
          <ScrollToBottom visible={true} onClick={scrollToBottom} />
        </div>
      )}
    </div>
  )
}
