import { useState } from 'react'
import { ChevronDown, Clock, CheckCircle2 } from 'lucide-react'
import type { ThinkingBlock as ThinkingBlockType } from '../../types/message'
import { cn } from '../../utils/cn'

interface Props {
  block: ThinkingBlockType
  onToggle: () => void
}

const MAX_VISIBLE_LINES = 10
const LINE_HEIGHT = 20 // approx px per line
const MAX_COLLAPSED_HEIGHT = MAX_VISIBLE_LINES * LINE_HEIGHT

export function ThinkingBlock({ block, onToggle }: Props) {
  const [showAll, setShowAll] = useState(false)

  // State A: Streaming
  if (block.status === 'streaming') {
    return (
      <div className="my-4">
        <div className="flex items-start gap-2.5">
          <Clock size={15} className="shrink-0 mt-0.5 text-text-400 thinking-pulse" />
          <div className="text-[13px] leading-[1.65] text-text-400 whitespace-pre-wrap">
            {block.text}
            <span className="inline-block w-1.5 h-3.5 bg-text-400/40 animate-pulse ml-0.5 align-middle rounded-sm" />
          </div>
        </div>
      </div>
    )
  }

  // Estimate if content is long
  const lineCount = block.text.split('\n').length
  const isLong = lineCount > MAX_VISIBLE_LINES || block.text.length > 500

  // State B/C: Done
  return (
    <div className="my-4">
      {/* Expandable thinking content */}
      <div className={cn('thinking-collapsible', block.isExpanded && 'expanded')}>
        <div>
          <div className="flex items-start gap-2.5 pb-2">
            <Clock size={15} className="shrink-0 mt-0.5 text-text-400" />
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'text-[13px] leading-[1.65] text-text-400/80 whitespace-pre-wrap',
                  !showAll && isLong && 'overflow-hidden relative',
                )}
                style={!showAll && isLong ? { maxHeight: MAX_COLLAPSED_HEIGHT } : undefined}
              >
                {block.text}
                {/* Fade gradient when collapsed + long */}
                {!showAll && isLong && (
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-bg-100 to-transparent" />
                )}
              </div>
              {/* Show more/less button */}
              {isLong && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAll(!showAll) }}
                  className="text-xs text-text-400 hover:text-text-200 mt-1 transition-colors"
                >
                  {showAll ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Done indicator */}
      <div className="flex items-center gap-2.5 mb-1">
        <CheckCircle2 size={15} className="text-text-400 shrink-0" />
        <span className="text-[13px] text-text-400">Done</span>
      </div>

      {/* Collapsed summary — clickable toggle */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[13px] text-text-300 hover:text-text-200 transition-colors ml-[26px]"
      >
        <span className="truncate max-w-[600px]">{block.summary}</span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 thinking-chevron', block.isExpanded && 'expanded')}
        />
      </button>
    </div>
  )
}
