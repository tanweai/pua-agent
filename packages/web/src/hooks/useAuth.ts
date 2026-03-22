import { useState, useCallback, useEffect } from 'react'

const TOKEN_KEY = 'pua-agent-token'
const USER_KEY = 'pua-agent-user'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY))
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => {
        if (r.ok) return r.json()
        throw new Error('expired')
      })
      .then(data => {
        setUsername(data.username)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUsername(null)
        setLoading(false)
      })
  }, [])

  const login = useCallback(async (usr: string, pwd: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usr, password: pwd }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, data.username)
    setToken(data.token)
    setUsername(data.username)
    return data
  }, [])

  const register = useCallback(async (usr: string, pwd: string, inviteCode: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usr, password: pwd, inviteCode }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Register failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, data.username)
    setToken(data.token)
    setUsername(data.username)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUsername(null)
  }, [])

  return { token, username, loading, isAuthenticated: !!token, login, register, logout }
}
