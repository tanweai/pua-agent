import { useEffect, useRef, useState, useCallback } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

interface Props {
  title: string
  code: string
  isStreaming: boolean
  onSendPrompt?: (text: string) => void
}

// Inject current theme CSS variables into iframe
function buildSrcdoc(widgetCode: string): string {
  const root = document.documentElement
  const style = getComputedStyle(root)

  const vars = [
    '--bg-100', '--bg-150', '--bg-200', '--bg-300',
    '--text-100', '--text-200', '--text-300', '--text-400',
    '--accent-100', '--accent-200',
    '--border-100', '--border-200',
    '--success', '--error', '--warning',
  ]

  const cssVars = vars
    .map((v) => `${v}: ${style.getPropertyValue(v).trim()};`)
    .join('\n    ')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    ${cssVars}
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    background: transparent;
    color: var(--text-100);
    overflow: hidden;
  }
  svg text { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
</style>
</head>
<body>
${widgetCode}
<script>
  // Height auto-resize
  function reportHeight() {
    const h = Math.max(document.body.scrollHeight, document.body.offsetHeight, 100);
    parent.postMessage({ type: 'widget-resize', height: h }, '*');
  }
  new ResizeObserver(reportHeight).observe(document.body);
  reportHeight();

  // sendPrompt bridge — allows widget to send messages to chat
  window.sendPrompt = function(text) {
    parent.postMessage({ type: 'widget-send-prompt', text: text }, '*');
  };
<\/script>
</body>
</html>`
}

export function WidgetRenderer({ title, code, isStreaming, onSendPrompt }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(200)
  const [fullscreen, setFullscreen] = useState(false)

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'widget-resize' && typeof e.data.height === 'number') {
        setHeight(Math.min(Math.max(e.data.height, 100), 800))
      }
      if (e.data?.type === 'widget-send-prompt' && typeof e.data.text === 'string') {
        onSendPrompt?.(e.data.text)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onSendPrompt])

  // Update iframe content on each streaming delta
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const srcdoc = buildSrcdoc(code)
    iframe.srcdoc = srcdoc
  }, [code])

  const toggleFullscreen = useCallback(() => {
    setFullscreen((v) => !v)
  }, [])

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8" onClick={toggleFullscreen}>
        <div className="relative bg-bg-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-100">
            <span className="text-sm font-medium text-text-100">{title}</span>
            <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-bg-200 text-text-300">
              <Minimize2 size={16} />
            </button>
          </div>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            className="w-full border-0"
            style={{ height: '80vh' }}
            title={title}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="my-3 rounded-xl border border-border-100 overflow-hidden max-w-[680px]">
      {/* Widget content */}
      <div className="relative bg-bg-100">
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          className="w-full border-0"
          style={{ height }}
          title={title}
        />

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="absolute bottom-2 right-2">
            <div className="px-2 py-1 bg-bg-200/80 backdrop-blur-sm rounded-md text-[10px] text-text-300 animate-pulse">
              Rendering...
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-100 bg-bg-150">
        <span className="text-xs text-text-300 truncate">{title}</span>
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded hover:bg-bg-200 text-text-400 hover:text-text-200 transition-colors"
          title="Fullscreen"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}
