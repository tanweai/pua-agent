import { ListTodo, CheckCircle2, Loader2, Clock, Circle } from 'lucide-react'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={14} className="text-success shrink-0 thinking-done-icon" />
    case 'in_progress':
      return <Loader2 size={14} className="text-accent-100 animate-spin-slow shrink-0" />
    default:
      return <Circle size={14} className="text-text-400 shrink-0" />
  }
}

export function TaskCard({ block, result }: Props) {
  const name = block.toolName.toLowerCase()
  const input = block.input || {}
  const isDone = block.status === 'done'

  // TaskCreate
  if (name === 'taskcreate') {
    return (
      <div className="my-2 tool-card-enter">
        <div className="flex items-start gap-2.5 px-4 py-2.5 rounded-xl border border-border-100 bg-bg-150">
          <div className="mt-0.5">
            {isDone ? (
              <CheckCircle2 size={15} className="text-success thinking-done-icon" />
            ) : (
              <Loader2 size={15} className="text-accent-100 animate-spin-slow" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ListTodo size={13} className="text-accent-100 shrink-0" />
              <span className="text-[13px] font-medium text-text-100">
                {isDone ? 'Task created' : 'Creating task...'}
              </span>
            </div>
            {input.subject && (
              <p className="text-[12px] text-text-200 mt-1 truncate">{input.subject}</p>
            )}
            {input.description && (
              <p className="text-[11px] text-text-400 mt-0.5 line-clamp-2">{input.description}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // TaskUpdate
  if (name === 'taskupdate') {
    const newStatus = input.status
    const taskId = input.taskId
    return (
      <div className="my-1.5 tool-card-enter">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border-100 bg-bg-150">
          <StatusIcon status={newStatus} />
          <span className="text-[12px] text-text-200">
            Task #{taskId}
          </span>
          {newStatus && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
              newStatus === 'completed' ? 'bg-success/10 text-success' :
              newStatus === 'in_progress' ? 'bg-accent-100/10 text-accent-100' :
              'bg-bg-300 text-text-400'
            }`}>
              {newStatus === 'in_progress' ? 'in progress' : newStatus}
            </span>
          )}
          {input.subject && (
            <span className="text-[11px] text-text-300 truncate flex-1">{input.subject}</span>
          )}
        </div>
      </div>
    )
  }

  // TaskList / TaskGet — compact read-only
  return (
    <div className="my-1 flex items-center gap-2 px-1 tool-card-enter">
      {isDone ? (
        <ListTodo size={14} className="text-text-400" />
      ) : (
        <Loader2 size={14} className="text-text-400 animate-spin-slow" />
      )}
      <span className="text-[12px] text-text-400 font-mono">
        {block.toolName}
      </span>
    </div>
  )
}
