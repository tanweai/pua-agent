import { ThinkingBlock } from './ThinkingBlock'
import { TextBlock } from './TextBlock'
import { ToolUseCard } from './ToolUseCard'
import { WidgetRenderer } from './WidgetRenderer'
import type { ContentBlock, ToolResultBlock } from '../../types/message'

interface Props {
  blocks: ContentBlock[]
  toolResults: Record<string, ToolResultBlock>
  onToggleThinking: (index: number) => void
  onSendPrompt?: (text: string) => void
}

export function BlockRenderer({ blocks, toolResults, onToggleThinking, onSendPrompt }: Props) {
  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'thinking':
            return <ThinkingBlock key={index} block={block} onToggle={() => onToggleThinking(index)} />
          case 'text':
            return <TextBlock key={index} block={block} />
          case 'tool_use': {
            // Visualizer widgets — inline iframe rendering
            if (block.toolName.startsWith('visualize:') || block.toolName === 'show_widget') {
              const input = block.input || {}
              return (
                <WidgetRenderer
                  key={index}
                  title={input.title || 'Widget'}
                  code={input.widget_code || input.code || ''}
                  isStreaming={block.status !== 'done'}
                  onSendPrompt={onSendPrompt}
                />
              )
            }
            return <ToolUseCard key={index} block={block} result={toolResults[block.toolId]} />
          }
          default:
            return null
        }
      })}
    </div>
  )
}
