import { ThinkingBlock } from './ThinkingBlock'
import { TextBlock } from './TextBlock'
import { ToolUseCard } from './ToolUseCard'
import type { ContentBlock, ToolResultBlock } from '../../types/message'

interface Props {
  blocks: ContentBlock[]
  toolResults: Record<string, ToolResultBlock>
  onToggleThinking: (index: number) => void
}

export function BlockRenderer({ blocks, toolResults, onToggleThinking }: Props) {
  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'thinking':
            return <ThinkingBlock key={index} block={block} onToggle={() => onToggleThinking(index)} />
          case 'text':
            return <TextBlock key={index} block={block} />
          case 'tool_use':
            return <ToolUseCard key={index} block={block} result={toolResults[block.toolId]} />
          default:
            return null
        }
      })}
    </div>
  )
}
