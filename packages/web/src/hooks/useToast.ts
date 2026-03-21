import { useState, useCallback, useRef } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerMap = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const show = useCallback((message: string, type: Toast['type'] = 'success', duration = 3000) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timerMap.current.delete(id)
    }, duration)

    timerMap.current.set(id, timer)
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    const timer = timerMap.current.get(id)
    if (timer) clearTimeout(timer)
    timerMap.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}
