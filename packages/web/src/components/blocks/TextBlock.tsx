import { useMemo } from 'react'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import { SystemReminder, extractSystemReminders } from './SystemReminder'
import type { CitationSource } from './CitationRef'
import type { TextBlock as TextBlockType } from '../../types/message'

interface Props {
  block: TextBlockType
  citations?: CitationSource[]
}

// Strip various "Sources" section patterns at the bottom of text
function stripSourcesSection(text: string): string {
  // Match common source/reference list patterns in both English and Chinese
  const patterns = [
    /\n+---\s*\n+\*?\*?(?:Sources?|References?|参考来源|来源|引用|参考资料|出处):?\*?\*?[\s\S]*$/i,
    /\n+\*?\*?(?:Sources?|References?|参考来源|来源|引用|参考资料|出处):?\*?\*?\s*\n[\s\S]*$/i,
    /\n+#{1,3}\s*(?:Sources?|References?|参考来源|来源|引用)\s*\n[\s\S]*$/i,
    // Numbered source lists: "\n1. [Name](url)" or "\n- [Name](url)" at the end
    /\n+(?:\d+\.\s*\[.+?\]\(.+?\)\s*\n?){2,}$/,
    /\n+(?:-\s*\[.+?\]\(.+?\)\s*\n?){2,}$/,
    // "数据来源：" / "Data sources:" inline at end
    /\n+\*?\*?(?:数据来源|资料来源|信息来源|Data\s*sources?):?\*?\*?[：:].{0,200}$/i,
  ]
  let result = text
  for (const pattern of patterns) {
    result = result.replace(pattern, '')
  }
  return result.trim()
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
