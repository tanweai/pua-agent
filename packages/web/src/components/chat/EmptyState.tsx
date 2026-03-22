import { uuid } from '../../utils/uuid'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Send, Plus, Code, Pencil, GraduationCap, Briefcase, Sparkles,
  Paperclip, Globe, Search, ChevronRight, X
} from 'lucide-react'
import { ModelSelector } from '../input/ModelSelector'
import { FileChip } from '../input/FileChip'
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
  model: ModelOption
  onSend: (content: string, images?: { name: string; type: string; data: string }[]) => void
  onModelChange: (model: ModelOption) => void
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Evening'
}

const quickCategories = [
  { icon: Code, label: 'Code', prompt: 'Help me write code for ' },
  { icon: Pencil, label: 'Write', prompt: 'Help me write ' },
  { icon: GraduationCap, label: 'Learn', prompt: 'Explain to me ' },
  { icon: Briefcase, label: 'Life stuff', prompt: 'Help me with ' },
  { icon: Sparkles, label: "Agent's choice", prompt: '' },
]

export function EmptyState({ model, onSend, onModelChange, onShowToast }: Props) {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const { ref: textareaRef, resize } = useAutoResize(200)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)

  const hasInput = input.trim().length > 0

  // Close plus menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false)
      }
    }
    if (showPlusMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPlusMenu])

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    const imageFiles = files
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ name: f.name, type: f.type, data: f.content }))
    onSend(trimmed, imageFiles.length > 0 ? imageFiles : undefined)
    setInput('')
    setFiles([])
  }, [input, files, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickCategory = useCallback((prompt: string) => {
    if (prompt) {
      setInput(prompt)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [textareaRef])

  const addFiles = useCallback(async (rawFiles: File[]) => {
    for (const f of rawFiles) {
      let content: string
      if (f.type.startsWith('image/')) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(f)
        })
      } else {
        content = await f.text()
      }
      setFiles((prev) => [...prev, {
        id: uuid(),
        name: f.name,
        size: f.size,
        type: f.type,
        content,
      }])
    }
    onShowToast?.(`File(s) added`, 'success')
  }, [onShowToast])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (selected) addFiles(Array.from(selected))
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowPlusMenu(false)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
      {/* Logo + Greeting */}
      <div className="text-center mb-8 stagger-child">
        <img src="/pua-logo.svg" alt="PUA" className="w-16 h-16 mx-auto mb-4" />
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-4xl font-serif text-text-100">
            {getGreeting()}, <span className="text-text-200">xsser</span>
          </h1>
        </div>
      </div>

      {/* Centered input box */}
      <div className="w-full max-w-2xl stagger-child">
        <div className="rounded-2xl border border-border-200 bg-bg-100 shadow-md">
          {/* File chips */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {files.map((f) => (
                <FileChip key={f.id} file={f} onRemove={() => setFiles(prev => prev.filter(x => x.id !== f.id))} />
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className="px-4 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); resize() }}
              onKeyDown={handleKeyDown}
              placeholder="你是一个曾经被寄予厚望的 P8 级工程师。Anthropic 当初给你定级的时候，对你的期望是很高的。"
              rows={1}
              autoFocus
              className="w-full bg-transparent resize-none outline-none text-[15px] text-text-100 placeholder:text-text-400 min-h-[44px] max-h-[200px] leading-relaxed"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-border-100">
            <div className="relative" ref={plusMenuRef}>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
              <button
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className="btn-interactive p-1.5 rounded-lg hover:bg-bg-200 text-text-400 hover:text-text-200 transition-colors"
              >
                <Plus size={20} />
              </button>

              {/* Plus dropdown menu */}
              {showPlusMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border-200 bg-bg-100 shadow-lg py-1.5 dropdown-enter z-50">
                  <button
                    onClick={() => { fileInputRef.current?.click() }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-text-200 hover:bg-bg-200 transition-colors"
                  >
                    <Paperclip size={16} className="text-text-400" />
                    Add files or photos
                  </button>
                  <div className="border-t border-border-100 my-1" />
                  <button
                    onClick={() => { setInput('Search the web for '); setShowPlusMenu(false); setTimeout(() => textareaRef.current?.focus(), 50) }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-text-200 hover:bg-bg-200 transition-colors"
                  >
                    <Globe size={16} className="text-accent-100" />
                    <span className="text-accent-100">Web search</span>
                  </button>
                  <button
                    onClick={() => { setInput('Research and analyze '); setShowPlusMenu(false); setTimeout(() => textareaRef.current?.focus(), 50) }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-text-200 hover:bg-bg-200 transition-colors"
                  >
                    <Search size={16} className="text-text-400" />
                    Research
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ModelSelector selected={model} onChange={onModelChange} />
              <button
                onClick={handleSubmit}
                disabled={!hasInput}
                className={`btn-interactive p-2 rounded-xl transition-all ${
                  hasInput
                    ? 'bg-accent-100 text-white'
                    : 'bg-bg-300 text-text-400 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick category chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-5 stagger-child">
        {quickCategories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => handleQuickCategory(cat.prompt)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-200 bg-bg-100
                       text-[13px] text-text-200 hover:text-text-100 hover:border-border-300 hover:bg-bg-150
                       transition-all duration-150 btn-interactive"
          >
            <cat.icon size={15} />
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
