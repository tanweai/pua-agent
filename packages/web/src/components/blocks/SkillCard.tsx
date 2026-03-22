import { Zap, CheckCircle2, Loader2 } from 'lucide-react'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function SkillCard({ block, result }: Props) {
  const input = block.input || {}
  const isDone = block.status === 'done'
  const skillName = input.skill_name || input.name || input.skill || 'unknown'

  return (
    <div className="my-2 tool-card-enter">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border-100 bg-bg-150">
        {isDone ? (
          <CheckCircle2 size={15} className="text-success shrink-0 thinking-done-icon" />
        ) : (
          <Loader2 size={15} className="text-accent-100 animate-spin-slow shrink-0" />
        )}
        <Zap size={15} className="text-warning shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-text-100">
            {isDone ? 'Skill loaded' : 'Loading skill...'}
          </span>
          <span className="text-[12px] text-text-300 ml-2 font-mono">{skillName}</span>
        </div>
        {input.args && (
          <span className="text-[10px] text-text-400 truncate max-w-[150px]">{input.args}</span>
        )}
      </div>
    </div>
  )
}
