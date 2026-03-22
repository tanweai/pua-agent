import { Bot, CheckCircle2, Loader2, Clock, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Collapsible } from '../ui/Collapsible'
import type { ToolUseBlock, ToolResultBlock, TaskProgress } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
  progress?: TaskProgress
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export function SubagentCard({ block, result, progress }: Props) {
  const [expanded, setExpanded] = useState(false)
  const agentName = block.input?.description || block.input?.subagent_type || block.input?.prompt?.slice(0, 50) || 'Agent'
  const agentType = block.input?.subagent_type || 'general-purpose'
  const isDone = block.status === 'done'
  const resultText = result?.content?.raw || result?.content || ''
  const resultPreview = typeof resultText === 'string' ? resultText.slice(0, 200) : ''

  const isRunning = progress?.status === 'running' || progress?.status === 'started'
  const isCompleted = progress?.status === 'completed' || isDone

  return (
    <div className="my-3 rounded-xl border border-border-100 bg-bg-150 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-bg-200 transition-colors"
        onClick={() => (isDone || isCompleted) && setExpanded(!expanded)}
      >
        {isCompleted ? (
          <CheckCircle2 size={16} className="text-success shrink-0" />
        ) : (
          <Loader2 size={16} className="text-accent-100 animate-spin-slow shrink-0" />
        )}
        <Bot size={16} className="text-text-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-text-100">{agentType}</span>
          <span className="text-[12px] text-text-400 ml-2">
            {isCompleted ? 'completed' : isRunning ? 'running...' : 'starting...'}
          </span>
        </div>

        {/* Progress stats */}
        {progress && (
          <div className="flex items-center gap-3 text-[11px] text-text-400">
            {progress.toolUseCount != null && (
              <span className="flex items-center gap-1">
                <Wrench size={11} />
                {progress.toolUseCount}
              </span>
            )}
            {progress.durationMs != null && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {formatDuration(progress.durationMs)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Task description */}
      <div className="px-4 pb-2">
        <p className="text-[12px] text-text-300 truncate">{agentName}</p>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="px-4 pb-2">
          <div className="h-1 rounded-full bg-bg-300 overflow-hidden">
            <div className="h-full rounded-full bg-accent-100 animate-progress-indeterminate" />
          </div>
        </div>
      )}

      {/* Summary from AI progress */}
      {progress?.summary && isRunning && (
        <div className="px-4 pb-2">
          <p className="text-[11px] text-text-400 italic truncate">{progress.summary}</p>
        </div>
      )}

      {/* Result preview (expandable) */}
      {(isDone || isCompleted) && resultPreview && (
        <Collapsible isOpen={expanded}>
          <div className="px-4 pb-3 border-t border-border-100 pt-2">
            <pre className="text-[12px] text-text-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {resultPreview}
            </pre>
          </div>
        </Collapsible>
      )}
    </div>
  )
}
