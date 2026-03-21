import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark'

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-mode')
    return (stored === 'dark' ? 'dark' : 'light')
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode)
    localStorage.setItem('theme-mode', mode)
  }, [mode])

  const toggle = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { mode, toggle }
}
