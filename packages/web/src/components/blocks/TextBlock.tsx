import { useMemo } from 'react'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import { SystemReminder, extractSystemReminders } from './SystemReminder'
import type { CitationSource } from './CitationRef'
import type { TextBlock as TextBlockType } from '../../types/message'

interface Props {
  block: TextBlockType
  citations?: CitationSource[]
}

// Strip "Sources:" / "来源:" section at the bottom of text
function stripSourcesSection(text: string): string {
  return text
    .replace(/\n+---\s*\n+\*?\*?Sources:?\*?\*?[\s\S]*$/i, '')
    .replace(/\n+\*?\*?Sources:?\*?\*?\s*\n[\s\S]*$/i, '')
    .replace(/\n+\*?\*?来源:?\*?\*?\s*\n[\s\S]*$/i, '')
    .trim()
}

export function TextBlock({ block, citations = [] }: Props) {
  if (!block.text) return null

  const { cleanText, reminders } = useMemo(
    () => extractSystemReminders(block.text),
    [block.text],
  )

  // Strip Sources section from the bottom
  const finalText = useMemo(() => stripSourcesSection(cleanText), [cleanText])

  return (
    <>
      {reminders.map((r, i) => (
        <SystemReminder key={`sr-${i}`} content={r} />
      ))}
      {finalText && (
        <div className="text-sm leading-relaxed text-text-100">
          <MarkdownRenderer
            content={finalText}
            isStreaming={block.status === 'streaming'}
            citations={citations}
          />
        </div>
      )}
    </>
  )
}
