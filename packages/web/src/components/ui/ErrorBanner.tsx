import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="mx-4 mb-3">
      <div className="max-w-3xl mx-auto rounded-xl border-l-4 border-error bg-error/5 px-4 py-3 message-enter">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-error shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-100">Something went wrong</p>
            <p className="text-sm text-text-300 mt-0.5">{message}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-interactive flex items-center gap-1.5 px-3 py-1.5 text-sm text-accent-100 bg-accent-100/10 rounded-lg hover:bg-accent-100/20"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
