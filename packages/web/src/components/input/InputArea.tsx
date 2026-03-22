import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Square, Plus, Flame } from 'lucide-react'
import { ModelSelector } from './ModelSelector'
import { FileChip } from './FileChip'
import { useAutoResize } from '../../hooks/useAutoResize'
import type { ModelOption } from '../../types/conversation'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  content: string
}

interface Props {
  isStreaming: boolean
  model: ModelOption
  puaMode?: boolean
  onSend: (content: string) => void
  onStop: () => void
  onModelChange: (model: ModelOption) => void
  onPuaModeChange?: (enabled: boolean) => void
  prefill?: string
  onClearPrefill?: () => void
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function InputArea({ isStreaming, model, puaMode, onSend, onStop, onModelChange, onPuaModeChange, prefill, onClearPrefill, onShowToast }: Props) {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const { ref: textareaRef, resize } = useAutoResize(300)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (prefill) {
      setInput(prefill)
      onClearPrefill?.()
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [prefill, onClearPrefill, textareaRef])

  const addFiles = useCallback(async (rawFiles: File[]) => {
    for (const f of rawFiles) {
      let content: string
      if (f.type.startsWith('image/')) {
        // Images: read as data URL (safe for display)
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(f)
        })
      } else {
        content = await f.text()
      }
      setFiles((prev) => [...prev, {
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
        content,
      }])
    }
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setInput('')
    setFiles([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [input, isStreaming, onSend, textareaRef])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    resize()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (selected) {
      addFiles(Array.from(selected))
      onShowToast?.(`${selected.length} file(s) added`, 'success')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const hasInput = input.trim().length > 0

  return (
    <div className="bg-bg-100 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-border-200 bg-bg-100 shadow-md">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {files.map((f) => (
                <FileChip key={f.id} file={f} onRemove={() => removeFile(f.id)} />
              ))}
            </div>
          )}

          <div className="px-4 pt-3 pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Reply..."
              rows={1}
              className="w-full bg-transparent resize-none outline-none text-[15px] text-text-100 placeholder:text-text-400 min-h-[56px] max-h-[300px] leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-border-100">
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-interactive p-1.5 rounded-lg hover:bg-bg-200 text-text-400 hover:text-text-200 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* PUA toggle */}
              <button
                onClick={() => onPuaModeChange?.(!puaMode)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  puaMode
                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                    : 'text-text-400 hover:text-text-200 hover:bg-bg-200'
                }`}
                title={puaMode ? 'PUA Mode ON — click to disable' : 'Enable PUA Mode'}
              >
                <Flame size={12} />
                PUA
              </button>

              <ModelSelector selected={model} onChange={onModelChange} />

              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="btn-interactive p-2 bg-error text-white rounded-lg hover:opacity-90"
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!hasInput}
                  className={`btn-interactive p-2 rounded-xl transition-all ${
                    hasInput
                      ? 'bg-text-100 text-bg-100 animate-send-ready'
                      : 'bg-bg-300 text-text-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
