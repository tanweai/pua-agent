import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  language: string
  code: string
}

export function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border-100">
      <div className="flex items-center justify-between px-4 py-1.5 bg-bg-200">
        <span className="text-xs text-text-300 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-text-300 hover:text-text-100 transition-colors"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto bg-bg-300 text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
