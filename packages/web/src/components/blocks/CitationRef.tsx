import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export interface CitationSource {
  title: string
  url: string
  domain: string
  snippet?: string
}

interface Props {
  source: CitationSource
}

export function CitationChip({ source }: Props) {
  const [showPopover, setShowPopover] = useState(false)
  let hideTimer: ReturnType<typeof setTimeout>

  const handleEnter = () => {
    clearTimeout(hideTimer)
    setShowPopover(true)
  }
  const handleLeave = () => {
    hideTimer = setTimeout(() => setShowPopover(false), 200)
  }

  // Short display name from domain
  const displayName = source.domain
    .replace(/^www\./, '')
    .replace(/\.com$|\.org$|\.net$|\.io$|\.cn$/, '')
    .split('.')[0]
  const capitalName = displayName.charAt(0).toUpperCase() + displayName.slice(1)

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Inline chip */}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 text-[12px] text-text-200 bg-bg-200 rounded-md border border-border-100 hover:bg-bg-300 hover:text-text-100 transition-colors no-underline align-baseline"
      >
        {capitalName}
        <ExternalLink size={10} className="opacity-50" />
      </a>

      {/* Hover popover */}
      {showPopover && (
        <div
          className="absolute bottom-full left-0 mb-2 w-72 bg-bg-100 border border-border-200 rounded-xl shadow-lg z-50 overflow-hidden pointer-events-auto"
          style={{ animation: 'popover-enter 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="px-3 py-2.5">
            <div className="flex items-start gap-2">
              <img
                src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=16`}
                alt="" width={16} height={16}
                className="shrink-0 mt-0.5 rounded-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-text-100 line-clamp-2">{source.title}</p>
                <p className="text-xs text-text-400 mt-0.5">{source.domain}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  )
}
