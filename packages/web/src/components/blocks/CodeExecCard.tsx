import { Play } from 'lucide-react'
import { Spinner } from '../ui/Spinner'
import { CodeBlock } from '../markdown/CodeBlock'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

export function CodeExecCard({ block, result }: Props) {
  const code = block.input?.code || ''
  const language = block.input?.language || 'python'
  const isLoading = block.status !== 'done'
  const output = result?.content?.output || ''

  return (
    <div className="my-3 rounded-xl border border-border-100 bg-bg-150 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5">
        {isLoading ? (
          <Spinner size={16} className="text-accent-100" />
        ) : (
          <Play size={16} className="text-success" />
        )}
        <span className="text-sm font-medium text-text-200">
          {isLoading ? 'Running code...' : 'Code executed'}
        </span>
      </div>
      {code && (
        <div className="px-3 pb-1">
          <CodeBlock language={language} code={code} />
        </div>
      )}
      {output && (
        <div className="px-3 pb-3">
          <p className="text-xs text-text-300 mb-1 px-1">Output:</p>
          <pre className="px-3 py-2 bg-bg-300 rounded-lg text-xs font-mono text-text-200 overflow-x-auto">{output}</pre>
        </div>
      )}
    </div>
  )
}
