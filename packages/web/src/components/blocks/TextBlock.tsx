import { useMemo } from 'react'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import type { CitationSource } from './CitationRef'
import type { TextBlock as TextBlockType } from '../../types/message'

interface Props {
  block: TextBlockType
  citations?: CitationSource[]
}

export function TextBlock({ block, citations = [] }: Props) {
  if (!block.text) return null

  return (
    <div className="text-sm leading-relaxed text-text-100">
      <MarkdownRenderer
        content={block.text}
        isStreaming={block.status === 'streaming'}
        citations={citations}
      />
    </div>
  )
}
