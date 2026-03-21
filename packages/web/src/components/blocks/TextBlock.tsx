import { useMemo } from 'react'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import { CitationRef, type CitationSource } from './CitationRef'
import type { TextBlock as TextBlockType } from '../../types/message'

interface Props {
  block: TextBlockType
  citations?: CitationSource[]
}

// Insert citation superscripts where text references known sources
function insertCitations(text: string, citations: CitationSource[]): { processed: string; refs: Map<number, CitationSource> } {
  if (!citations.length) return { processed: text, refs: new Map() }

  const refs = new Map<number, CitationSource>()
  let processed = text
  let refCount = 0

  // Match URLs in text and link them to citation sources
  for (const source of citations) {
    if (!source.domain) continue

    // Check if this domain/URL appears in the text
    const domainEscaped = source.domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const urlPattern = new RegExp(`(https?://[^\\s)]*${domainEscaped}[^\\s)"]*)`, 'g')

    if (urlPattern.test(processed)) {
      refCount++
      refs.set(refCount, source)
      // Replace first occurrence of full URL with just the text + citation mark
      processed = processed.replace(urlPattern, (match) => {
        return `${match} [^cite:${refCount}]`
      })
    }
  }

  return { processed, refs }
}

export function TextBlock({ block, citations = [] }: Props) {
  if (!block.text) return null

  const { processed, refs } = useMemo(
    () => insertCitations(block.text, citations),
    [block.text, citations],
  )

  return (
    <div className="text-sm leading-relaxed text-text-100">
      <MarkdownRenderer
        content={processed}
        isStreaming={block.status === 'streaming'}
        citations={refs}
      />
    </div>
  )
}
