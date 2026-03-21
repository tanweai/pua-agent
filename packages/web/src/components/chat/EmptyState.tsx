import { Pencil, Search, Code, Palette } from 'lucide-react'

interface Props {
  onQuickAction: (text: string) => void
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const quickActions = [
  { icon: Pencil, label: 'Write', desc: 'content', prompt: 'Help me write ' },
  { icon: Search, label: 'Research', desc: 'a topic', prompt: 'Research and summarize ' },
  { icon: Code, label: 'Write', desc: 'code', prompt: 'Write code for ' },
  { icon: Palette, label: 'Create', desc: 'designs', prompt: 'Create a design for ' },
]

export function EmptyState({ onQuickAction }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-bg-200 flex items-center justify-center text-2xl font-semibold text-accent-100 stagger-child">
          C
        </div>
        <h2 className="text-xl font-semibold text-text-100 mb-1 stagger-child">{getGreeting()}</h2>
        <p className="text-sm text-text-400 mb-8 stagger-child">What can I help you with?</p>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label + action.desc}
              onClick={() => onQuickAction(action.prompt)}
              className="stagger-child btn-interactive flex items-center gap-3 px-4 py-3 bg-bg-150 rounded-xl border border-border-100 text-left hover:border-accent-100/30 hover:bg-bg-200 transition-colors"
            >
              <action.icon size={18} className="text-accent-100 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-100">{action.label}</p>
                <p className="text-xs text-text-400">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
