import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import type { Toast } from '../../hooks/useToast'

interface Props {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const icons = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <AlertCircle size={16} className="text-error" />,
  info: <Info size={16} className="text-accent-100" />,
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-[200] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className="toast-enter flex items-center gap-2 px-4 py-2.5 bg-bg-100 border border-border-200 rounded-xl shadow-lg cursor-pointer -translate-x-1/2 whitespace-nowrap text-sm text-text-100"
        >
          {icons[toast.type]}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
