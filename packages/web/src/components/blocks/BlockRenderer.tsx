import { useMemo } from 'react'
import { ThinkingBlock } from './ThinkingBlock'
import { TextBlock } from './TextBlock'
import { ToolUseCard } from './ToolUseCard'
import { WidgetRenderer } from './WidgetRenderer'
import { TeamPanel } from './TeamPanel'
import type { ContentBlock, ToolResultBlock, TaskProgress } from '../../types/message'
import type { CitationSource } from './CitationRef'

interface Props {
  blocks: ContentBlock[]
  toolResults: Record<string, ToolResultBlock>
  taskProgress?: Record<string, TaskProgress>
  onToggleThinking: (index: number) => void
  onSendPrompt?: (text: string) => void
}

export function BlockRenderer({ blocks, toolResults, taskProgress, onToggleThinking, onSendPrompt }: Props) {
  // Collect citation sources from all tool results (search results)
  const citations = useMemo<CitationSource[]>(() => {
    const sources: CitationSource[] = []
    for (const result of Object.values(toolResults)) {
      if (result.content?.results) {
        for (const r of result.content.results) {
          if (r.title && r.domain && !sources.some(s => s.domain === r.domain && s.title === r.title)) {
            sources.push({ title: r.title, url: r.url || '', domain: r.domain, snippet: r.snippet })
          }
        }
      }
    }
    return sources
  }, [toolResults])

  // Show Team Panel when 2+ agent blocks exist (aggregated view)
  const agentBlockCount = blocks.filter(
    b => b.type === 'tool_use' && (b.toolName.toLowerCase() === 'agent' || b.toolName.toLowerCase() === 'task')
  ).length

  return (
    <div className="space-y-3">
      {agentBlockCount >= 2 && (
        <TeamPanel blocks={blocks} taskProgress={taskProgress} />
      )}
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'thinking':
            return <ThinkingBlock key={index} block={block} onToggle={() => onToggleThinking(index)} />
          case 'text':
            return <TextBlock key={index} block={block} citations={citations} />
          case 'tool_use': {
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
            return <ToolUseCard key={index} block={block} result={toolResults[block.toolId]} progress={taskProgress?.[block.toolId]} onSendPrompt={onSendPrompt} />
          }
          default:
            return null
        }
      })}
    </div>
  )
}
