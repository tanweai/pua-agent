import { Wrench } from 'lucide-react'
import { Spinner } from '../ui/Spinner'
import { SearchCard } from './SearchCard'
import { FetchCard } from './FetchCard'
import { CodeExecCard } from './CodeExecCard'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function ToolUseCard({ block, result }: Props) {
  const name = block.toolName.toLowerCase()
  switch (true) {
    case name === 'web_search' || name === 'websearch':
      return <SearchCard block={block} result={result} />
    case name === 'web_fetch' || name === 'webfetch':
      return <FetchCard block={block} />
    case name === 'code_execution':
      return <CodeExecCard block={block} result={result} />
    default:
      return (
        <div className="my-3 rounded-xl border border-border-100 bg-bg-150 px-4 py-3">
          <div className="flex items-center gap-2">
            {block.status !== 'done' ? (
              <Spinner size={16} className="text-accent-100" />
            ) : (
              <Wrench size={16} className="text-text-300" />
            )}
            <span className="text-sm text-text-200">{block.toolName}</span>
          </div>
          {Object.keys(block.input).length > 0 && (
            <pre className="mt-2 text-xs font-mono text-text-300 bg-bg-200 rounded-lg px-3 py-2 overflow-x-auto">
              {JSON.stringify(block.input, null, 2)}
            </pre>
          )}
        </div>
      )
  }
}
