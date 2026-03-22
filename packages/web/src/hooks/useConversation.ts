import { uuid } from '../utils/uuid'
import { useState, useCallback, useRef } from 'react'
import type { Message } from '../types/message'
import type { Conversation } from '../types/conversation'
import { MODEL_OPTIONS } from '../types/conversation'

const DEFAULT_MODEL = MODEL_OPTIONS[1] // Agent (GLM-5)

export function useConversation() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [model, setModel] = useState(DEFAULT_MODEL)
  const activeIdRef = useRef<string | null>(null)

  const createConversation = useCallback(() => {
    const id = uuid()
    const conv: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      model: model.id,
      thinkingEnabled: model.hasThinking,
      thinkingBudget: 10000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(id)
    activeIdRef.current = id
    setMessages([])
    return conv
  }, [model])

  const selectConversation = useCallback((id: string) => {
    setActiveId(id)
    activeIdRef.current = id
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === id)
      if (conv) setMessages(conv.messages)
      return prev
    })
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeIdRef.current === id) {
      setActiveId(null)
      activeIdRef.current = null
      setMessages([])
    }
  }, [])

  const addMessage = useCallback((msg: Message) => {
    const currentId = activeIdRef.current
    setMessages((prev) => [...prev, msg])
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c
        const newMessages = [...c.messages, msg]
        // Auto-title from first user message
        let title = c.title
        if (c.messages.length === 0 && msg.role === 'user' && msg.content) {
          title = msg.content.slice(0, 30) + (msg.content.length > 30 ? '...' : '')
        }
        return { ...c, messages: newMessages, updatedAt: Date.now(), title }
      }),
    )
  }, [])

  const updateLastMessage = useCallback((msg: Message) => {
    const currentId = activeIdRef.current
    setMessages((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = msg
      return updated
    })
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c
        const msgs = [...c.messages]
        msgs[msgs.length - 1] = msg
        return { ...c, messages: msgs, updatedAt: Date.now() }
      }),
    )
  }, [])

  const toggleThinkingBlock = useCallback((messageIndex: number, blockIndex: number) => {
    setMessages((prev) => {
      const updated = [...prev]
      const msg = { ...updated[messageIndex], blocks: [...updated[messageIndex].blocks] }
      const block = msg.blocks[blockIndex]
      if (block?.type === 'thinking') {
        msg.blocks[blockIndex] = { ...block, isExpanded: !block.isExpanded }
      }
      updated[messageIndex] = msg
      return updated
    })
  }, [])

  return {
    conversations,
    activeId,
    messages,
    model,
    setModel,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateLastMessage,
    toggleThinkingBlock,
  }
}
