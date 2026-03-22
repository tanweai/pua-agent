import { Plus, Trash2, Bot, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { useState, useCallback } from 'react'

export interface AgentDefinition {
  id: string
  name: string
  description: string
  prompt: string
  tools: string[]
  enabled: boolean
}

interface Props {
  agents: AgentDefinition[]
  onChange: (agents: AgentDefinition[]) => void
}

const DEFAULT_TOOLS = ['Read', 'Glob', 'Grep', 'Bash', 'WebSearch', 'WebFetch']

export function AgentConfig({ agents, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = useCallback(() => {
    const newAgent: AgentDefinition = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      prompt: '',
      tools: [...DEFAULT_TOOLS],
      enabled: true,
    }
    onChange([...agents, newAgent])
    setEditingId(newAgent.id)
    setExpanded(true)
  }, [agents, onChange])

  const handleUpdate = useCallback((id: string, field: keyof AgentDefinition, value: any) => {
    onChange(agents.map(a => a.id === id ? { ...a, [field]: value } : a))
  }, [agents, onChange])

  const handleDelete = useCallback((id: string) => {
    onChange(agents.filter(a => a.id !== id))
    if (editingId === id) setEditingId(null)
  }, [agents, onChange, editingId])

  const handleToggle = useCallback((id: string) => {
    onChange(agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }, [agents, onChange])

  return (
    <div className="border-t border-border-100 mt-2 pt-2">
      <div
        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-bg-300/60 rounded-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Bot size={14} className="text-text-300" />
        <span className="text-[12px] font-medium text-text-300">Custom Agents</span>
        <span className="text-[11px] text-text-400 ml-1">{agents.filter(a => a.enabled).length} active</span>
        <div className="flex-1" />
        {expanded ? <ChevronUp size={12} className="text-text-400" /> : <ChevronDown size={12} className="text-text-400" />}
      </div>

      {expanded && (
        <div className="px-2 py-2 space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-lg border border-border-100 bg-bg-100 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agent.enabled}
                  onChange={() => handleToggle(agent.id)}
                  className="rounded"
                />
                {editingId === agent.id ? (
                  <input
                    value={agent.name}
                    onChange={(e) => handleUpdate(agent.id, 'name', e.target.value)}
                    placeholder="Agent name"
                    className="flex-1 text-[12px] bg-transparent border-b border-border-200 outline-none text-text-100 px-1"
                  />
                ) : (
                  <span
                    className="flex-1 text-[12px] text-text-200 cursor-pointer"
                    onClick={() => setEditingId(agent.id)}
                  >
                    {agent.name || 'Unnamed agent'}
                  </span>
                )}
                <button onClick={() => handleDelete(agent.id)} className="p-0.5 text-text-400 hover:text-error">
                  <Trash2 size={12} />
                </button>
              </div>

              {editingId === agent.id && (
                <div className="mt-2 space-y-1.5">
                  <input
                    value={agent.description}
                    onChange={(e) => handleUpdate(agent.id, 'description', e.target.value)}
                    placeholder="Description (what this agent does)"
                    className="w-full text-[11px] bg-bg-200 rounded px-2 py-1 outline-none text-text-200 placeholder:text-text-400"
                  />
                  <textarea
                    value={agent.prompt}
                    onChange={(e) => handleUpdate(agent.id, 'prompt', e.target.value)}
                    placeholder="System prompt for the agent"
                    rows={2}
                    className="w-full text-[11px] bg-bg-200 rounded px-2 py-1 outline-none text-text-200 placeholder:text-text-400 resize-none"
                  />
                  <div className="flex flex-wrap gap-1">
                    {DEFAULT_TOOLS.map(tool => (
                      <label key={tool} className="flex items-center gap-1 text-[10px] text-text-300">
                        <input
                          type="checkbox"
                          checked={agent.tools.includes(tool)}
                          onChange={(e) => {
                            const tools = e.target.checked
                              ? [...agent.tools, tool]
                              : agent.tools.filter(t => t !== tool)
                            handleUpdate(agent.id, 'tools', tools)
                          }}
                          className="rounded"
                        />
                        {tool}
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 text-[11px] text-accent-100 hover:text-accent-200"
                  >
                    <Save size={10} /> Done
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-lg border border-dashed border-border-200
                       text-[12px] text-text-400 hover:text-text-200 hover:border-accent-100 transition-colors"
          >
            <Plus size={12} /> Add Agent
          </button>
        </div>
      )}
    </div>
  )
}
