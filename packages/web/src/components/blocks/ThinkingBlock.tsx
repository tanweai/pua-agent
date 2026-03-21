import { ChevronDown, Clock, CheckCircle2 } from 'lucide-react'
import type { ThinkingBlock as ThinkingBlockType } from '../../types/message'
import { cn } from '../../utils/cn'

interface Props {
  block: ThinkingBlockType
  onToggle: () => void
}

export function ThinkingBlock({ block, onToggle }: Props) {
  // State A: Streaming
  if (block.status === 'streaming') {
    return (
      <div className="my-2">
        <div className="flex items-start gap-2 text-text-300">
          <Clock size={16} className="shrink-0 mt-0.5 thinking-pulse" />
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {block.text}
            <span className="inline-block w-1.5 h-4 bg-accent-100 animate-pulse ml-0.5 align-middle" />
          </div>
        </div>
      </div>
    )
  }

  // State B/C: Done — CSS Grid animated collapse
  return (
    <div className="my-2">
      {/* Expandable thinking content — animated with CSS Grid */}
      <div className={cn('thinking-collapsible', block.isExpanded && 'expanded')}>
        <div>
          <div className="flex items-start gap-2 text-text-300 pb-2">
            <Clock size={16} className="shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {block.text}
            </div>
          </div>
        </div>
      </div>

      {/* Done indicator */}
      <div className="flex items-center gap-2 mb-0.5">
        <CheckCircle2 size={16} className="text-text-400 shrink-0" />
        <span className="text-sm text-text-400">Done</span>
      </div>

      {/* Collapsed summary — clickable toggle */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm text-text-300 hover:text-text-200 transition-colors"
      >
        <span className="truncate">{block.summary}</span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 thinking-chevron', block.isExpanded && 'expanded')}
        />
      </button>
    </div>
  )
}
