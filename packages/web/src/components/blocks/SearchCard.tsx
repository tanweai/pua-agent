import { Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '../ui/Spinner'
import { cn } from '../../utils/cn'
import type { ToolUseBlock, ToolResultBlock } from '../../types/message'

interface Props {
  block: ToolUseBlock
  result?: ToolResultBlock
}

const COLLAPSED_COUNT = 5

export function SearchCard({ block, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const query = block.input?.query || block.inputBuffer || ''
  const results: any[] = result?.content?.results || []
  const isLoading = block.status !== 'done'
  const hasMore = results.length > COLLAPSED_COUNT
  const visibleResults = results.slice(0, COLLAPSED_COUNT)
  const extraResults = results.slice(COLLAPSED_COUNT)

  return (
    <div className="my-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Globe size={16} className="text-text-300 shrink-0" />
        <span className="text-sm text-text-300 flex-1 truncate">{query}</span>
        {!isLoading && results.length > 0 && (
          <span className="text-sm text-text-400 shrink-0">{results.length} results</span>
        )}
        {!isLoading && hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-0.5 rounded hover:bg-bg-200 text-text-400 hover:text-text-200 transition-colors shrink-0"
            title={expanded ? 'Show less' : 'Show more'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        {isLoading && <Spinner size={16} className="text-text-300 shrink-0" />}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border-100 bg-bg-100 overflow-hidden">
          {/* Always-visible results */}
          {visibleResults.map((r: any, i: number) => (
            <SearchResultRow key={i} result={r} index={i} />
          ))}

          {/* Expandable extra results — CSS Grid animated */}
          {hasMore && (
            <div className={cn('search-collapsible', expanded && 'expanded')}>
              <div>
                {extraResults.map((r: any, i: number) => (
                  <SearchResultRow key={i + COLLAPSED_COUNT} result={r} index={i} animate={expanded} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading bar */}
      {isLoading && (
        <div className="mt-1">
          <div className="search-loading-bar w-full" />
        </div>
      )}
    </div>
  )
}

// Clean title: strip JSON fragments, web_search_prime_result_summary, etc.
function cleanTitle(raw: string): string {
  if (!raw) return ''
  // Remove web_search_prime_result_summary prefix and JSON
  let clean = raw.replace(/^web_search_prime_result_summary:\s*/i, '')
  // Remove JSON objects/fragments
  clean = clean.replace(/\{[^}]*\}/g, '')
  // Remove JSON-like syntax
  clean = clean.replace(/"text"\s*:\s*/g, '')
  clean = clean.replace(/"title"\s*:\s*"/g, '').replace(/"link"\s*:\s*"/g, '')
  clean = clean.replace(/[{}"\[\]]/g, '')
  // Clean up whitespace
  clean = clean.replace(/\s+/g, ' ').trim()
  // If still looks like JSON noise, return domain
  if (clean.length < 3 || clean.includes('content') && clean.includes('refer')) return ''
  return clean
}

function SearchResultRow({ result: r, index, animate }: { result: any; index: number; animate?: boolean }) {
  const title = cleanTitle(r.title) || r.domain || r.url
  if (!title && !r.domain) return null

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-bg-150 transition-colors border-b border-border-100 last:border-b-0"
      style={animate ? { animation: `result-appear 250ms var(--ease-out-expo) ${index * 60}ms both` } : undefined}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${r.domain || 'example.com'}&sz=16`}
        alt="" width={16} height={16}
        className="shrink-0 rounded-sm"
        loading="lazy"
      />
      <span className="text-[13px] text-text-100 truncate flex-1">{title}</span>
      <span className="text-[13px] text-text-400 shrink-0">{r.domain || ''}</span>
    </div>
  )
}
