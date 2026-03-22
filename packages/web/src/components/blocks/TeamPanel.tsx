import { Bot, CheckCircle2, Loader2, Clock, Wrench, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { ContentBlock, TaskProgress } from '../../types/message'

interface Props {
  blocks: ContentBlock[]
  taskProgress?: Record<string, TaskProgress>
}

interface AgentInfo {
  toolId: string
  name: string
  type: string
  prompt: string
  status: 'pending' | 'running' | 'completed'
  progress?: TaskProgress
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export function TeamPanel({ blocks, taskProgress }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const agents = useMemo<AgentInfo[]>(() => {
    return blocks
      .filter((b) => b.type === 'tool_use' && (b.toolName.toLowerCase() === 'agent' || b.toolName.toLowerCase() === 'task'))
      .map((b) => {
        if (b.type !== 'tool_use') return null!
        const progress = taskProgress?.[b.toolId]
        let status: AgentInfo['status'] = 'pending'
        if (b.status === 'done' || progress?.status === 'completed') status = 'completed'
        else if (b.status === 'executing' || progress?.status === 'running' || progress?.status === 'started') status = 'running'

        return {
          toolId: b.toolId,
          name: b.input?.description || b.input?.subagent_type || 'Agent',
          type: b.input?.subagent_type || 'general-purpose',
          prompt: b.input?.prompt?.slice(0, 80) || '',
          status,
          progress,
        }
      })
      .filter(Boolean)
  }, [blocks, taskProgress])

  if (agents.length === 0) return null

  const running = agents.filter(a => a.status === 'running').length
  const completed = agents.filter(a => a.status === 'completed').length
  const total = agents.length

  return (
    <div className="my-3 rounded-xl border border-border-100 bg-bg-150 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-bg-200 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Users size={16} className="text-accent-100 shrink-0" />
        <span className="text-[13px] font-medium text-text-100">Agent Team</span>
        <span className="text-[12px] text-text-400 ml-1">
          {completed}/{total} completed
          {running > 0 && ` · ${running} running`}
        </span>
        <div className="flex-1" />
        {collapsed ? <ChevronDown size={14} className="text-text-400" /> : <ChevronUp size={14} className="text-text-400" />}
      </div>

      {/* Agent list */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-1.5">
          {agents.map((agent) => (
            <div
              key={agent.toolId}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-100 border border-border-100"
            >
              {agent.status === 'completed' ? (
                <CheckCircle2 size={14} className="text-success shrink-0" />
              ) : agent.status === 'running' ? (
                <Loader2 size={14} className="text-accent-100 animate-spin-slow shrink-0" />
              ) : (
                <Bot size={14} className="text-text-400 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-text-200 truncate">{agent.type}</span>
                  {agent.progress?.toolUseCount != null && (
                    <span className="flex items-center gap-0.5 text-[10px] text-text-400">
                      <Wrench size={10} />
                      {agent.progress.toolUseCount}
                    </span>
                  )}
                  {agent.progress?.durationMs != null && (
                    <span className="flex items-center gap-0.5 text-[10px] text-text-400">
                      <Clock size={10} />
                      {formatDuration(agent.progress.durationMs)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-400 truncate">{agent.name}</p>
                {agent.status === 'running' && agent.progress?.summary && (
                  <p className="text-[10px] text-text-400 italic truncate mt-0.5">{agent.progress.summary}</p>
                )}
              </div>

              {/* Mini progress bar for running agents */}
              {agent.status === 'running' && (
                <div className="w-16 h-1 rounded-full bg-bg-300 overflow-hidden shrink-0">
                  <div className="h-full rounded-full bg-accent-100 animate-progress-indeterminate" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
