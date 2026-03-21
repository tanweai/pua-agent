import { useEffect } from 'react'

interface ShortcutHandlers {
  onNewChat?: () => void
  onToggleSidebar?: () => void
  onToggleTheme?: () => void
  onSearch?: () => void
  onStopGeneration?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+Shift+N → new chat
      if (meta && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        handlers.onNewChat?.()
      }
      // Cmd+Shift+S → toggle sidebar
      if (meta && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        handlers.onToggleSidebar?.()
      }
      // Cmd+Shift+D → toggle dark mode
      if (meta && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        handlers.onToggleTheme?.()
      }
      // Cmd+K → search
      if (meta && e.key === 'k') {
        e.preventDefault()
        handlers.onSearch?.()
      }
      // Cmd+. → stop generation
      if (meta && e.key === '.') {
        e.preventDefault()
        handlers.onStopGeneration?.()
      }
    }

    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [handlers])
}
