import { Search, Globe, FileText, FolderSearch, Terminal, Bot, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ToolInfo {
  name: string
  icon: string
  description: string
  category: string
}

interface Props {
  onSelect: (prompt: string) => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  search: Search,
  globe: Globe,
  'file-text': FileText,
  'folder-search': FolderSearch,
  terminal: Terminal,
  bot: Bot,
  zap: Zap,
}

const QUICK_ACTIONS: { label: string; prompt: string; icon: React.ElementType }[] = [
  { label: 'Web Search', prompt: 'Search the web for ', icon: Search },
  { label: 'Analyze File', prompt: 'Read and analyze ', icon: FileText },
  { label: 'Run Command', prompt: 'Run the command: ', icon: Terminal },
  { label: 'Subagent', prompt: 'Use a subagent to ', icon: Bot },
]

export function SkillChips({ onSelect }: Props) {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/agent/tools')
      .then(r => r.json())
      .then(data => setTools(data.tools || []))
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-wrap gap-1.5 px-1">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.prompt)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-200 bg-bg-100
                     text-[12px] text-text-300 hover:text-text-100 hover:border-accent-100 hover:bg-accent-100/5
                     transition-all duration-150"
        >
          <action.icon size={12} />
          {action.label}
        </button>
      ))}

      {showAll && tools.length > 0 && (
        <div className="w-full mt-2 p-2 rounded-lg border border-border-100 bg-bg-150">
          <p className="text-[11px] text-text-400 uppercase tracking-wider mb-2">Available Tools</p>
          <div className="grid grid-cols-2 gap-1">
            {tools.map((tool) => {
              const Icon = ICON_MAP[tool.icon] || Zap
              return (
                <button
                  key={tool.name}
                  onClick={() => onSelect(`Use ${tool.name} to `)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-bg-200 transition-colors"
                >
                  <Icon size={12} className="text-text-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[12px] text-text-200 font-medium">{tool.name}</span>
                    <p className="text-[10px] text-text-400 truncate">{tool.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAll(!showAll)}
        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-text-400 hover:text-text-200 transition-colors"
      >
        {showAll ? 'Less' : 'More...'}
      </button>
    </div>
  )
}
