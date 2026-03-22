import { MessageCircleQuestion, CheckCircle2, Loader2 } from 'lucide-react'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
  onSendPrompt?: (text: string) => void
}

export function AskUserCard({ block, result, onSendPrompt }: Props) {
  const input = block.input || {}
  const question = input.question || input.message || input.prompt || ''
  const options = input.options as string[] | undefined
  const isDone = block.status === 'done'
  const answer = result?.content

  return (
    <div className="my-3 tool-card-enter">
      <div className="rounded-xl border-2 border-accent-100/30 bg-accent-100/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          {isDone ? (
            <CheckCircle2 size={16} className="text-success shrink-0 thinking-done-icon" />
          ) : (
            <MessageCircleQuestion size={16} className="text-accent-100 shrink-0" />
          )}
          <span className="text-[13px] font-medium text-text-100">
            {isDone ? 'Question answered' : 'Agent is asking...'}
          </span>
        </div>

        {/* Question text */}
        {question && (
          <div className="px-4 pb-3">
            <p className="text-[13px] text-text-200 leading-relaxed">{question}</p>
          </div>
        )}

        {/* Options buttons */}
        {options && options.length > 0 && !isDone && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSendPrompt?.(opt)}
                className="px-3 py-1.5 rounded-lg border border-accent-100/30 bg-bg-100
                         text-[12px] text-accent-100 hover:bg-accent-100/10
                         transition-all duration-150 btn-interactive"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Answer display */}
        {isDone && answer && (
          <div className="px-4 pb-3 border-t border-accent-100/10 pt-2">
            <p className="text-[12px] text-text-300 italic">
              {typeof answer === 'string' ? answer : JSON.stringify(answer)}
            </p>
          </div>
        )}

        {/* Waiting indicator */}
        {!isDone && (
          <div className="px-4 pb-3">
            <div className="h-1 rounded-full bg-bg-300 overflow-hidden">
              <div className="h-full rounded-full bg-accent-100/50 animate-progress-indeterminate" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
