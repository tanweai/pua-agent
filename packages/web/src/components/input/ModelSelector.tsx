import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { MODEL_OPTIONS, type ModelOption } from '../../types/conversation'

interface Props {
  selected: ModelOption
  onChange: (model: ModelOption) => void
}

export function ModelSelector({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-text-300 hover:text-text-100 transition-colors px-2 py-1 rounded-lg hover:bg-bg-200"
      >
        {selected.displayName}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 right-0 min-w-[240px] bg-bg-100 border border-border-200 rounded-xl shadow-lg py-1 dropdown-enter z-50">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.name}
              onClick={() => { onChange(m); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-200 hover:bg-bg-200 transition-colors text-left whitespace-nowrap"
            >
              {selected.name === m.name ? (
                <Check size={14} className="text-accent-100 shrink-0" />
              ) : (
                <span className="w-[14px] shrink-0" />
              )}
              <span className="shrink-0">{m.displayName}</span>
              {m.hasThinking && (
                <span className="ml-auto text-[10px] text-accent-100 bg-accent-100/10 px-1.5 py-0.5 rounded shrink-0">thinking</span>
              )}
              {m.useAgent && (
                <span className="ml-auto text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded shrink-0">agent</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
