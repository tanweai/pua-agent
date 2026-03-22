import { Bot, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Collapsible } from '../ui/Collapsible'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function SubagentCard({ block, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const agentName = block.input?.description || block.input?.subagent_type || block.input?.prompt?.slice(0, 50) || 'Agent'
  const agentType = block.input?.subagent_type || 'general-purpose'
  const isDone = block.status === 'done'
  const resultText = result?.content?.raw || result?.content || ''
  const resultPreview = typeof resultText === 'string' ? resultText.slice(0, 200) : ''

  return (
    <div className="my-3 rounded-xl border border-border-100 bg-bg-150 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-bg-200 transition-colors"
        onClick={() => isDone && setExpanded(!expanded)}
      >
        {isDone ? (
          <CheckCircle2 size={16} className="text-success shrink-0" />
        ) : (
          <Loader2 size={16} className="text-accent-100 animate-spin-slow shrink-0" />
        )}
        <Bot size={16} className="text-text-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-text-100">{agentType}</span>
          <span className="text-[12px] text-text-400 ml-2">{isDone ? 'completed' : 'running...'}</span>
        </div>
      </div>

      {/* Task description */}
      <div className="px-4 pb-2">
        <p className="text-[12px] text-text-300 truncate">{agentName}</p>
      </div>

      {/* Result preview (expandable) */}
      {isDone && resultPreview && (
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
