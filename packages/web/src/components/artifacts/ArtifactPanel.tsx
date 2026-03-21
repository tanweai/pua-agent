import { useState, useCallback } from 'react'
import { X, ExternalLink, Download, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { ArtifactPreview } from './ArtifactPreview'
import { ArtifactCode } from './ArtifactCode'
import type { ArtifactFile } from '../../types/artifact'

interface Props {
  artifact: ArtifactFile
  onClose: () => void
}

type Tab = 'preview' | 'code'

export function ArtifactPanel({ artifact, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('preview')
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [artifact.content])

  const handleDownload = useCallback(() => {
    const blob = new Blob([artifact.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = artifact.filename
    a.click()
    URL.revokeObjectURL(url)
  }, [artifact])

  return (
    <div className="w-[480px] lg:w-[520px] border-l border-border-100 bg-bg-100 flex flex-col h-full artifact-panel-enter shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-100">
        <h3 className="text-sm font-medium text-text-100 truncate flex-1">{artifact.title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-200 text-text-300 ml-2">
          <X size={16} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border-100">
        <button
          onClick={() => setTab('preview')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
            tab === 'preview' ? 'text-text-100' : 'text-text-400 hover:text-text-200'
          }`}
        >
          Preview
          {tab === 'preview' && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent-100 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setTab('code')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
            tab === 'code' ? 'text-text-100' : 'text-text-400 hover:text-text-200'
          }`}
        >
          Code
          {tab === 'code' && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent-100 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {tab === 'preview' ? (
        <ArtifactPreview artifact={artifact} />
      ) : (
        <ArtifactCode artifact={artifact} />
      )}

      {/* Action bar */}
      <div className="border-t border-border-100 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="btn-interactive flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-300 hover:text-text-100 rounded-lg hover:bg-bg-200">
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleDownload} className="btn-interactive flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-300 hover:text-text-100 rounded-lg hover:bg-bg-200">
            <Download size={13} />
            Download
          </button>
        </div>

        {artifact.versions.length > 1 && (
          <div className="flex items-center gap-1 text-xs text-text-400">
            <button className="p-1 hover:bg-bg-200 rounded"><ChevronLeft size={14} /></button>
            <span>{artifact.version}/{artifact.versions.length}</span>
            <button className="p-1 hover:bg-bg-200 rounded"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
