import { FileText, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Collapsible } from '../ui/Collapsible'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function ReadCard({ block, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const input = block.input || {}
  const isDone = block.status === 'done'
  const filePath = input.file_path || input.path || ''
  const fileName = filePath.split('/').pop() || filePath

  const resultContent = result?.content
  const fileContent = typeof resultContent === 'string'
    ? resultContent
    : resultContent?.content || resultContent?.text || (resultContent ? JSON.stringify(resultContent) : '')
  const hasContent = fileContent && fileContent.length > 0
  const lineCount = hasContent ? fileContent.split('\n').length : 0

  return (
    <div className="my-2 tool-card-enter">
      <div className="rounded-xl border border-border-100 bg-bg-150 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-bg-200 transition-colors"
          onClick={() => hasContent && setExpanded(!expanded)}
        >
          {isDone ? (
            <CheckCircle2 size={15} className="text-success shrink-0 thinking-done-icon" />
          ) : (
            <Loader2 size={15} className="text-accent-100 animate-spin-slow shrink-0" />
          )}
          <FileText size={15} className="text-text-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-medium text-text-200">{fileName}</span>
          </div>
          {isDone && lineCount > 0 && (
            <span className="text-[10px] text-text-400">{lineCount} lines</span>
          )}
          {hasContent && (
            expanded
              ? <ChevronUp size={12} className="text-text-400 shrink-0" />
              : <ChevronDown size={12} className="text-text-400 shrink-0" />
          )}
        </div>

        {/* Full path */}
        {filePath && filePath !== fileName && (
          <div className="px-4 pb-1">
            <p className="text-[10px] text-text-400 font-mono truncate">{filePath}</p>
          </div>
        )}

        {/* Content preview */}
        <Collapsible isOpen={expanded}>
          <div className="border-t border-border-100 px-4 py-2">
            <pre className="text-[11px] text-text-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {fileContent.slice(0, 2000)}{fileContent.length > 2000 ? '\n...(truncated)' : ''}
            </pre>
          </div>
        </Collapsible>
      </div>
    </div>
  )
}
