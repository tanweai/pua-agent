import { useCallback, useRef } from 'react'
import type { CitationSource } from '../components/blocks/CitationRef'
import type { ToolResultBlock } from '../types/message'

export interface CitationRegistry {
  sources: CitationSource[]
  addFromToolResult: (result: ToolResultBlock) => void
  getSource: (index: number) => CitationSource | undefined
}

export function useCitations(): CitationRegistry {
  const sourcesRef = useRef<CitationSource[]>([])

  const addFromToolResult = useCallback((result: ToolResultBlock) => {
    if (!result.content?.results) return
    for (const r of result.content.results) {
      if (r.title && r.domain) {
        // Avoid duplicates by domain
        if (!sourcesRef.current.some(s => s.domain === r.domain && s.title === r.title)) {
          sourcesRef.current.push({
            title: r.title,
            url: r.url || '',
            domain: r.domain,
            snippet: r.snippet,
          })
        }
      }
    }
  }, [])

  const getSource = useCallback((index: number) => {
    return sourcesRef.current[index]
  }, [])

  return {
    get sources() { return sourcesRef.current },
    addFromToolResult,
    getSource,
  }
}
