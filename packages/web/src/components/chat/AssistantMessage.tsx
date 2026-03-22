import { ThumbsUp, ThumbsDown, Copy, RefreshCw, Check } from 'lucide-react'
import { useCallback, useState } from 'react'
import { BlockRenderer } from '../blocks/BlockRenderer'
import type { Message } from '../../types/message'

interface Props {
  message: Message
  onToggleThinking: (index: number) => void
  onShowToast?: (msg: string) => void
  onSendPrompt?: (text: string) => void
}

export function AssistantMessage({ message, onToggleThinking, onShowToast, onSendPrompt }: Props) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<'up' | 'down' | null>(null)

  const handleCopy = useCallback(() => {
    const text = message.blocks
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    onShowToast?.('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }, [message.blocks, onShowToast])

  const handleLike = useCallback((type: 'up' | 'down') => {
    setLiked((prev) => (prev === type ? null : type))
  }, [])

  return (
    <div className="message-enter">
      <div className="max-w-3xl mx-auto px-4">
        <BlockRenderer
          blocks={message.blocks}
          toolResults={message.toolResults || {}}
          taskProgress={message.taskProgress}
          onToggleThinking={onToggleThinking}
          onSendPrompt={onSendPrompt}
        />

        {/* Agent result badge */}
        {message.agentResult && !message.isStreaming && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-text-400 tool-card-enter">
            {message.agentResult.subtype === 'success' ? (
              <span className="px-2 py-0.5 rounded-full bg-success/10 text-success">completed</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-error/10 text-error">{message.agentResult.subtype}</span>
            )}
            {message.agentResult.numTurns != null && (
              <span>{message.agentResult.numTurns} turns</span>
            )}
            {message.agentResult.totalInputTokens != null && message.agentResult.totalOutputTokens != null && (
              <span>{(message.agentResult.totalInputTokens / 1000).toFixed(0)}k in / {(message.agentResult.totalOutputTokens / 1000).toFixed(0)}k out</span>
            )}
            {message.agentResult.totalCostUsd != null && (
              <span>${message.agentResult.totalCostUsd.toFixed(4)}</span>
            )}
          </div>
        )}

        {/* Action bar — separate hover zone, not affected by search cards */}
        {!message.isStreaming && message.blocks.length > 0 && (
          <div className="group/actions mt-2">
            <div className="opacity-0 group-hover/actions:opacity-100 transition-opacity duration-150 flex items-center gap-1">
            <button
              onClick={() => handleLike('up')}
              className={`p-1.5 rounded-lg transition-colors ${
                liked === 'up'
                  ? 'text-success bg-success/10'
                  : 'text-text-400 hover:text-text-200 hover:bg-bg-200'
              }`}
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={() => handleLike('down')}
              className={`p-1.5 rounded-lg transition-colors ${
                liked === 'down'
                  ? 'text-error bg-error/10'
                  : 'text-text-400 hover:text-text-200 hover:bg-bg-200'
              }`}
            >
              <ThumbsDown size={14} />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-bg-200 text-text-400 hover:text-text-200 transition-colors"
            >
              {copied ? <Check size={14} className="text-success animate-check-pop" /> : <Copy size={14} />}
            </button>
            <button className="p-1.5 rounded-lg hover:bg-bg-200 text-text-400 hover:text-text-200 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
