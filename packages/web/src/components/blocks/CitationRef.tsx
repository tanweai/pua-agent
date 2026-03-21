import { useState, useRef, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

export interface CitationSource {
  title: string
  url: string
  domain: string
  snippet?: string
}

interface Props {
  number: number
  source: CitationSource
}

export function CitationRef({ number, source }: Props) {
  const [showPopover, setShowPopover] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!showPopover) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPopover])

  return (
    <span ref={ref} className="relative inline">
      <button
        onClick={() => setShowPopover(!showPopover)}
        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 text-[11px] font-semibold leading-none text-accent-100 bg-accent-100/10 rounded cursor-pointer align-super transition-all hover:bg-accent-100/20 hover:scale-110 active:scale-95"
      >
        {number}
      </button>

      {showPopover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-bg-100 border border-border-200 rounded-xl shadow-lg z-50 overflow-hidden"
          style={{ animation: 'popover-enter 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="px-3 py-2.5">
            <div className="flex items-start gap-2">
              <img
                src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=16`}
                alt="" width={16} height={16}
                className="shrink-0 mt-0.5 rounded-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-100 line-clamp-2">{source.title}</p>
                <p className="text-xs text-text-400 mt-0.5">{source.domain}</p>
                {source.snippet && (
                  <p className="text-xs text-text-300 mt-1.5 italic line-clamp-3">"{source.snippet}"</p>
                )}
              </div>
            </div>
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 border-t border-border-100 text-xs text-accent-100 hover:bg-bg-150 transition-colors"
          >
            <ExternalLink size={12} />
            Open source
          </a>
        </div>
      )}
    </span>
  )
}
