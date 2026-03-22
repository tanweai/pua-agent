import { Wrench, FileText, Terminal, FolderSearch, Search as SearchIcon, Send } from 'lucide-react'
import { Spinner } from '../ui/Spinner'
import { SearchCard } from './SearchCard'
import { FetchCard } from './FetchCard'
import { CodeExecCard } from './CodeExecCard'
import { SubagentCard } from './SubagentCard'
import { TaskCard } from './TaskCard'
import { AskUserCard } from './AskUserCard'
import { TeamCard } from './TeamCard'
import { FileEditCard } from './FileEditCard'
import { SkillCard } from './SkillCard'
import { BashCard } from './BashCard'
import { ReadCard } from './ReadCard'
import type { ToolUseBlock, ToolResultBlock, TaskProgress } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
  progress?: TaskProgress
  onSendPrompt?: (text: string) => void
}

// Map tool names to icons for compact display
function getToolIcon(name: string) {
  switch (name.toLowerCase()) {
    case 'read': return FileText
    case 'bash': return Terminal
    case 'glob': case 'grep': return FolderSearch
    case 'sendmessage': return Send
    default: return Wrench
  }
}

export function ToolUseCard({ block, result, progress, onSendPrompt }: Props) {
  const name = block.toolName.toLowerCase()

  // === Agent/Task — subagent invocation ===
  if (name === 'agent') {
    return <SubagentCard block={block} result={result} progress={progress} />
  }

  // === WebSearch ===
  if (name === 'web_search' || name === 'websearch') {
    return <SearchCard block={block} result={result} />
  }

  // === WebFetch ===
  if (name === 'web_fetch' || name === 'webfetch') {
    return <FetchCard block={block} />
  }

  // === Code execution ===
  if (name === 'code_execution') {
    return <CodeExecCard block={block} result={result} />
  }

  // === TaskCreate / TaskUpdate / TaskList / TaskGet ===
  if (name === 'taskcreate' || name === 'taskupdate' || name === 'tasklist' || name === 'taskget') {
    return <TaskCard block={block} result={result} />
  }

  // === AskUserQuestion ===
  if (name === 'askuserquestion') {
    return <AskUserCard block={block} result={result} onSendPrompt={onSendPrompt} />
  }

  // === TeamCreate / TeamDelete ===
  if (name === 'teamcreate' || name === 'teamdelete') {
    return <TeamCard block={block} result={result} />
  }

  // === Edit / Write — file operations ===
  if (name === 'edit' || name === 'write') {
    return <FileEditCard block={block} result={result} />
  }

  // === Skill ===
  if (name === 'skill') {
    return <SkillCard block={block} result={result} />
  }

  // === Bash ===
  if (name === 'bash') {
    return <BashCard block={block} result={result} />
  }

  // === Read ===
  if (name === 'read') {
    return <ReadCard block={block} result={result} />
  }

  // === Generic compact display for Glob, Grep, SendMessage, etc. ===
  const Icon = getToolIcon(block.toolName)
  const inputPreview = block.input?.file_path
    || block.input?.command?.slice(0, 60)
    || block.input?.pattern
    || block.input?.to
    || ''

  return (
    <div className="my-1 flex items-center gap-2 px-1 tool-card-enter">
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
