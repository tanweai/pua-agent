import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, MessageSquare } from 'lucide-react'
import type { Conversation } from '../../types/conversation'

interface Props {
  isOpen: boolean
  conversations: Conversation[]
  onSelect: (id: string) => void
  onClose: () => void
}

export function SearchDialog({ isOpen, conversations, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query
    ? conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : conversations.slice(0, 8)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      onSelect(filtered[selectedIndex].id)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filtered, selectedIndex, onSelect, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="dialog-enter relative w-full max-w-lg bg-bg-100 border border-border-200 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-100">
          <Search size={18} className="text-text-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent outline-none text-sm text-text-100 placeholder:text-text-400"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {!query && filtered.length > 0 && (
            <p className="px-4 py-1.5 text-[11px] font-medium text-text-400 uppercase tracking-wider">Recent</p>
          )}
          {filtered.map((conv, i) => (
            <button
              key={conv.id}
              onClick={() => { onSelect(conv.id); onClose() }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === selectedIndex ? 'bg-bg-200' : 'hover:bg-bg-150'
              }`}
            >
              <MessageSquare size={14} className="text-text-400 shrink-0" />
              <span className="text-sm text-text-100 truncate flex-1">{conv.title}</span>
              <span className="text-[11px] text-text-400 shrink-0">
                {new Date(conv.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-text-400 text-center py-8">No conversations found</p>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border-100 px-4 py-2 flex items-center gap-4 text-[11px] text-text-400">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  )
}
