import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import type { ArtifactFile } from '../../types/artifact'

interface Props {
  artifact: ArtifactFile
}

export function ArtifactCode({ artifact }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [artifact.content])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-100">
        <span className="text-xs text-text-300 font-mono">{artifact.filename}</span>
        <button
          onClick={handleCopy}
          className="btn-interactive flex items-center gap-1 text-xs text-text-300 hover:text-text-100"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-4 bg-bg-300 text-sm font-mono leading-relaxed text-text-100">
        <code>{artifact.content}{artifact.isStreaming && <span className="animate-cursor-blink text-accent-100">|</span>}</code>
      </pre>
    </div>
  )
}
