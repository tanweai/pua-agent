import { FilePlus, FileEdit, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Collapsible } from '../ui/Collapsible'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function FileEditCard({ block, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const input = block.input || {}
  const isDone = block.status === 'done'
  const name = block.toolName.toLowerCase()

  const isCreate = name === 'write'
  const filePath = input.file_path || input.path || ''
  const fileName = filePath.split('/').pop() || filePath

  // For Edit: show old→new
  const oldStr = input.old_string || ''
  const newStr = input.new_string || ''
  const hasContent = isCreate ? !!input.content : !!(oldStr || newStr)

  return (
    <div className="my-2 tool-card-enter">
      <div className="rounded-xl border border-border-100 bg-bg-150 overflow-hidden">
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-bg-200 transition-colors"
          onClick={() => hasContent && setExpanded(!expanded)}
        >
          {isDone ? (
            <CheckCircle2 size={15} className="text-success shrink-0 thinking-done-icon" />
          ) : (
            <Loader2 size={15} className="text-accent-100 animate-spin-slow shrink-0" />
          )}
          {isCreate ? (
            <FilePlus size={15} className="text-success shrink-0" />
          ) : (
            <FileEdit size={15} className="text-accent-100 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-medium text-text-100">
              {isCreate ? 'Create' : 'Edit'}
            </span>
            <span className="text-[12px] text-text-300 font-mono ml-2 truncate">
              {fileName}
            </span>
          </div>
          {hasContent && (
            <span className="text-[10px] text-text-400">
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </div>

        {/* File path */}
        {filePath && filePath !== fileName && (
          <div className="px-4 pb-1">
            <p className="text-[10px] text-text-400 font-mono truncate">{filePath}</p>
          </div>
        )}

        {/* Diff preview */}
        <Collapsible isOpen={expanded}>
          <div className="px-4 pb-3 border-t border-border-100 pt-2">
            {!isCreate && oldStr && (
              <div className="mb-1">
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto diff-line-removed px-2 py-1 rounded">
                  {oldStr.slice(0, 300)}{oldStr.length > 300 ? '...' : ''}
                </pre>
              </div>
            )}
            {!isCreate && newStr && (
              <pre className="text-[11px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto diff-line-added px-2 py-1 rounded">
                {newStr.slice(0, 300)}{newStr.length > 300 ? '...' : ''}
              </pre>
            )}
            {isCreate && input.content && (
              <pre className="text-[11px] text-text-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                {input.content.slice(0, 500)}{input.content.length > 500 ? '...' : ''}
              </pre>
            )}
          </div>
        </Collapsible>
      </div>
    </div>
  )
}
