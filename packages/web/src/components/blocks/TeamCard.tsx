import { Users, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function TeamCard({ block, result }: Props) {
  const input = block.input || {}
  const isDone = block.status === 'done'
  const isDelete = block.toolName.toLowerCase() === 'teamdelete'
  const teamName = input.name || input.team_name || 'Team'

  return (
    <div className="my-3 tool-card-enter">
      <div className={`rounded-xl border overflow-hidden ${
        isDelete ? 'border-error/20 bg-error/5' : 'border-border-100 bg-bg-150'
      }`}>
        <div className="flex items-center gap-2.5 px-4 py-3">
          {isDone ? (
            isDelete ? (
              <Trash2 size={16} className="text-error shrink-0 thinking-done-icon" />
            ) : (
              <CheckCircle2 size={16} className="text-success shrink-0 thinking-done-icon" />
            )
          ) : (
            <Loader2 size={16} className="text-accent-100 animate-spin-slow shrink-0" />
          )}
          <Users size={16} className="text-text-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-medium text-text-100">
              {isDelete ? 'Removing team' : 'Creating team'}
            </span>
            <span className="text-[12px] text-text-400 ml-2">
              {isDone ? (isDelete ? 'removed' : 'created') : '...'}
            </span>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-mono text-accent-100">{teamName}</span>
          </div>
          {input.agents && typeof input.agents === 'object' && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Array.isArray(input.agents) ? input.agents : Object.keys(input.agents)).map((agent: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-bg-300 text-[11px] text-text-300"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {typeof agent === 'string' ? agent : (agent as any).name || `Agent ${i + 1}`}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isDone && (
          <div className="px-4 pb-2">
            <div className="h-1 rounded-full bg-bg-300 overflow-hidden">
              <div className="h-full rounded-full bg-accent-100 animate-progress-indeterminate" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
