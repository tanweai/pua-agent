import { useMemo } from 'react'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import { SystemReminder, extractSystemReminders } from './SystemReminder'
import type { CitationSource } from './CitationRef'
import type { TextBlock as TextBlockType } from '../../types/message'

interface Props {
  block: TextBlockType
  citations?: CitationSource[]
}

export function TextBlock({ block, citations = [] }: Props) {
  if (!block.text) return null

  const { cleanText, reminders } = useMemo(
    () => extractSystemReminders(block.text),
    [block.text],
  )

  return (
    <>
      {reminders.map((r, i) => (
        <SystemReminder key={`sr-${i}`} content={r} />
      ))}
      {cleanText && (
        <div className="text-sm leading-relaxed text-text-100">
          <MarkdownRenderer
            content={cleanText}
            isStreaming={block.status === 'streaming'}
            citations={citations}
          />
        </div>
      )}
    </>
  )
}
