import { Terminal, CheckCircle2, Loader2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Collapsible } from '../ui/Collapsible'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function BashCard({ block, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const input = block.input || {}
  const isDone = block.status === 'done'
  const command = input.command || ''
  const description = input.description || ''

  // Parse result content
  const resultContent = result?.content
  const stdout = typeof resultContent === 'string'
    ? resultContent
    : resultContent?.stdout || resultContent?.output || (resultContent ? JSON.stringify(resultContent) : '')
  const hasOutput = stdout && stdout.length > 0
  const exitCode = resultContent?.exit_code ?? resultContent?.exitCode
  const isError = exitCode != null && exitCode !== 0

  return (
    <div className="my-2 tool-card-enter">
      <div className={`rounded-xl border overflow-hidden ${
        isError ? 'border-error/20 bg-error/5' : 'border-border-100 bg-bg-150'
      }`}>
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-bg-200 transition-colors"
          onClick={() => hasOutput && setExpanded(!expanded)}
        >
          {!isDone ? (
            <Loader2 size={15} className="text-accent-100 animate-spin-slow shrink-0" />
          ) : isError ? (
            <XCircle size={15} className="text-error shrink-0 thinking-done-icon" />
          ) : (
            <CheckCircle2 size={15} className="text-success shrink-0 thinking-done-icon" />
          )}
          <Terminal size={15} className="text-text-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <code className="text-[12px] text-text-200 font-mono truncate block">
              {command.length > 80 ? command.slice(0, 80) + '...' : command}
            </code>
          </div>
          {exitCode != null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              isError ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
            }`}>
              exit {exitCode}
            </span>
          )}
          {hasOutput && (
            expanded
              ? <ChevronUp size={12} className="text-text-400 shrink-0" />
              : <ChevronDown size={12} className="text-text-400 shrink-0" />
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="px-4 pb-1">
            <p className="text-[10px] text-text-400">{description}</p>
          </div>
        )}

        {/* Running indicator */}
        {!isDone && (
          <div className="px-4 pb-2">
            <div className="h-1 rounded-full bg-bg-300 overflow-hidden">
              <div className="h-full rounded-full bg-accent-100 animate-progress-indeterminate" />
            </div>
          </div>
        )}

        {/* Output */}
        <Collapsible isOpen={expanded}>
          <div className="border-t border-border-100 px-4 py-2">
            <pre className="text-[11px] text-text-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {stdout.slice(0, 2000)}{stdout.length > 2000 ? '\n...(truncated)' : ''}
            </pre>
          </div>
        </Collapsible>
      </div>
    </div>
  )
}
