import { useEffect, useRef, useState } from 'react'
import type { ArtifactFile } from '../../types/artifact'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'

interface Props {
  artifact: ArtifactFile
}

export function ArtifactPreview({ artifact }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(400)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'resize' && typeof e.data.height === 'number') {
        setHeight(Math.min(Math.max(e.data.height + 32, 200), 800))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  if (artifact.isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-full px-6">
          <div className="h-4 rounded-md skeleton-shimmer w-3/4" />
          <div className="h-4 rounded-md skeleton-shimmer w-full" />
          <div className="h-4 rounded-md skeleton-shimmer w-5/6" />
          <div className="h-32 rounded-lg skeleton-shimmer w-full mt-4" />
          <div className="h-4 rounded-md skeleton-shimmer w-2/3" />
        </div>
      </div>
    )
  }

  // Markdown preview
  if (artifact.extension === 'md') {
    return (
      <div className="flex-1 overflow-auto p-6">
        <MarkdownRenderer content={artifact.content} />
      </div>
    )
  }

  // SVG — render in sandboxed iframe for safety
  if (artifact.extension === 'svg') {
    const svgDoc = `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:transparent}</style></head><body>${artifact.content}</body></html>`
    return (
      <div className="flex-1 overflow-auto">
        <iframe
          srcDoc={svgDoc}
          sandbox=""
          className="w-full border-0"
          style={{ height }}
          title={artifact.title}
        />
      </div>
    )
  }

  // HTML / JSX / TSX — iframe sandbox
  const isHTML = artifact.extension === 'html'
  const srcdoc = isHTML
    ? artifact.content
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;padding:16px;background:#fff}</style></head><body><pre style="white-space:pre-wrap;font-size:13px;line-height:1.6"><code>${artifact.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre><script>new ResizeObserver(()=>{parent.postMessage({type:'resize',height:document.body.scrollHeight},'*')}).observe(document.body)<\/script></body></html>`

  return (
    <div className="flex-1 overflow-auto">
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        sandbox="allow-scripts allow-forms"
        className="w-full border-0"
        style={{ height }}
        title={artifact.title}
      />
    </div>
  )
}
