import { Wrench, FileText, Terminal, FolderSearch, Search as SearchIcon } from 'lucide-react'
import { Spinner } from '../ui/Spinner'
import { SearchCard } from './SearchCard'
import { FetchCard } from './FetchCard'
import { CodeExecCard } from './CodeExecCard'
import { SubagentCard } from './SubagentCard'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

// Map tool names to icons
function getToolIcon(name: string) {
  switch (name.toLowerCase()) {
    case 'read': return FileText
    case 'bash': return Terminal
    case 'glob': case 'grep': return FolderSearch
    case 'skill': return SearchIcon
    default: return Wrench
  }
}

export function ToolUseCard({ block, result }: Props) {
  const name = block.toolName.toLowerCase()

  // Agent/Task — subagent invocation
  if (name === 'agent' || name === 'task') {
    return <SubagentCard block={block} result={result} />
  }

  // WebSearch
  if (name === 'web_search' || name === 'websearch') {
    return <SearchCard block={block} result={result} />
  }

  // WebFetch
  if (name === 'web_fetch' || name === 'webfetch') {
    return <FetchCard block={block} />
  }

  // Code execution
  if (name === 'code_execution') {
    return <CodeExecCard block={block} result={result} />
  }

  // Skill invocation
  if (name === 'skill') {
    return (
      <div className="my-2 flex items-center gap-2 px-1">
        {block.status !== 'done' ? (
          <Spinner size={14} className="text-accent-100" />
        ) : (
          <SearchIcon size={14} className="text-success" />
        )}
        <span className="text-[13px] text-text-300">
          Skill: {block.input?.skill_name || block.input?.name || 'unknown'}
        </span>
      </div>
    )
  }

  // Generic tool — compact display for Read, Bash, Glob, Grep, etc.
  const Icon = getToolIcon(block.toolName)
  const inputPreview = block.input?.file_path || block.input?.command?.slice(0, 60) || block.input?.pattern || ''

  return (
    <div className="my-1 flex items-center gap-2 px-1">
      {block.status !== 'done' ? (
        <Spinner size={14} className="text-text-400" />
      ) : (
        <Icon size={14} className="text-text-400" />
      )}
      <span className="text-[12px] text-text-400 font-mono truncate max-w-[500px]">
        {block.toolName}{inputPreview ? `: ${inputPreview}` : ''}
      </span>
    </div>
  )
}
