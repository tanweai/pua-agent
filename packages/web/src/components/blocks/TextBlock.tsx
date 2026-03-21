import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import type { TextBlock as TextBlockType } from '../../types/message'

interface Props {
  block: TextBlockType
}

export function TextBlock({ block }: Props) {
  if (!block.text) return null

  return (
    <div className="text-sm leading-relaxed text-text-100">
      <MarkdownRenderer content={block.text} isStreaming={block.status === 'streaming'} />
    </div>
  )
}
