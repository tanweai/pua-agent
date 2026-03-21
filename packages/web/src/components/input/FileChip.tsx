import { X, FileText, Image, FileSpreadsheet } from 'lucide-react'

interface Props {
  file: { name: string; size: number; type: string }
  onRemove: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image size={16} className="text-accent-100" />
  if (type.includes('spreadsheet') || type.includes('csv')) return <FileSpreadsheet size={16} className="text-success" />
  return <FileText size={16} className="text-accent-100" />
}

export function FileChip({ file, onRemove }: Props) {
  return (
    <div className="file-chip-enter flex items-center gap-2 px-3 py-2 bg-bg-150 border border-border-100 rounded-xl text-sm">
      <FileIcon type={file.type} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-100 truncate max-w-[120px]">{file.name}</p>
        <p className="text-[10px] text-text-400">{formatSize(file.size)}</p>
      </div>
      <button onClick={onRemove} className="p-0.5 rounded hover:bg-bg-200 text-text-400 hover:text-error transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}
