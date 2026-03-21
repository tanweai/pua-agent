import { Link } from 'lucide-react'
import { Spinner } from '../ui/Spinner'
import type { ToolUseBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
}

export function FetchCard({ block }: Props) {
  const url = block.input?.url || ''
  const isLoading = block.status !== 'done'

  return (
    <div className="my-3 rounded-xl border border-border-100 bg-bg-150 px-4 py-3">
      <div className="flex items-center gap-2">
        <Link size={16} className="text-accent-100 shrink-0" />
        <p className="text-sm text-text-200 truncate flex-1">Reading {url}</p>
        {isLoading && <Spinner size={16} className="text-accent-100" />}
      </div>
      {isLoading && (
        <p className="text-xs text-text-400 mt-1.5 ml-6">Fetching content...</p>
      )}
    </div>
  )
}
