import { useState, useCallback, useEffect } from 'react'
import { Upload } from 'lucide-react'

interface Props {
  onDrop: (files: File[]) => void
  children: React.ReactNode
}

export function FileDropZone({ onDrop, children }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = { current: 0 }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    dragCounter.current = 0
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onDrop(files)
  }, [onDrop])

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 flex flex-col min-w-0 min-h-0"
    >
      {children}

      {isDragging && (
        <div className="fixed inset-2 z-[100] flex items-center justify-center rounded-2xl border-2 border-dashed border-accent-100 bg-bg-100/[0.92] backdrop-blur-sm">
          <div className="text-center">
            <Upload size={32} className="mx-auto text-accent-100 drop-icon mb-3" />
            <p className="text-sm font-medium text-text-100">Drop files here to upload</p>
            <p className="text-xs text-text-400 mt-1">PDF, images, code, text, spreadsheets</p>
          </div>
        </div>
      )}
    </div>
  )
}
