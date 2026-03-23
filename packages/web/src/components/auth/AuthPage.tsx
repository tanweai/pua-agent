import { useState } from 'react'
import { ArrowRight, UserPlus, LogIn, KeyRound, Check, X } from 'lucide-react'

interface Props {
  onLogin: (username: string, password: string) => Promise<any>
  onRegister: (username: string, password: string, inviteCode: string) => Promise<any>
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    { label: '至少6位', pass: password.length >= 6 },
    { label: '包含数字', pass: /\d/.test(password) },
    { label: '包含字母', pass: /[a-zA-Z]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length
  const color = score <= 1 ? 'bg-error' : score === 2 ? 'bg-warning' : 'bg-success'

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? color : 'bg-bg-300'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-0.5 text-[10px] ${c.pass ? 'text-success' : 'text-text-400'}`}>
            {c.pass ? <Check size={10} /> : <X size={10} />}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function AuthPage({ onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await onLogin(username, password)
      } else if (mode === 'register') {
        await onRegister(username, password, inviteCode)
      } else {
        // Reset password
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, inviteCode, newPassword }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSuccess('密码已重置，请登录')
        setTimeout(() => { setMode('login'); setSuccess('') }, 2000)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-border-200 bg-bg-100 text-[14px] text-text-100 placeholder:text-text-400 outline-none focus:border-accent-100 transition-colors"

  return (
    <div className="min-h-screen bg-bg-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <img src="/pua-logo.svg" alt="PUA Agent" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-text-100">PUA Agent</h1>
          <p className="text-sm text-text-400 mt-1">个人生产力放大器</p>
        </div>

        {/* Tab switch */}
        {mode !== 'reset' ? (
          <div className="flex rounded-xl bg-bg-200 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                mode === 'login' ? 'bg-bg-100 text-text-100 shadow-sm' : 'text-text-400'
              }`}
            >
              <LogIn size={14} />
              登录
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                mode === 'register' ? 'bg-bg-100 text-text-100 shadow-sm' : 'text-text-400'
              }`}
            >
              <UserPlus size={14} />
              注册
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => { setMode('login'); setError('') }} className="text-[13px] text-text-400 hover:text-text-200">
              ← 返回登录
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 text-[13px] text-text-100 font-medium">
              <KeyRound size={14} />
              重置密码
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invite code (register + reset) */}
          {(mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-[12px] text-text-300 mb-1.5">
                {mode === 'reset' ? '注册时使用的邀请码' : '邀请码'}
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={mode === 'reset' ? '输入你注册时的邀请码' : '请输入邀请码'}
                required
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] text-text-300 mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              required
              autoFocus
              className={inputClass}
            />
          </div>

          {mode !== 'reset' ? (
            <div>
              <label className="block text-[12px] text-text-300 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
                minLength={6}
                className={inputClass}
              />
              {mode === 'register' && <PasswordStrength password={password} />}
            </div>
          ) : (
            <div>
              <label className="block text-[12px] text-text-300 mb-1.5">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码"
                required
                minLength={6}
                className={inputClass}
              />
              <PasswordStrength password={newPassword} />
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-[13px] text-error">
              {error}
            </div>
          )}

          {success && (
            <div className="px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-[13px] text-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-100 text-white text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin-slow">⏳</span>
            ) : (
              <>
                {mode === 'login' ? '登录' : mode === 'register' ? '注册' : '重置密码'}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Forgot password link */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('reset'); setError('') }}
              className="w-full text-center text-[12px] text-text-400 hover:text-accent-100 transition-colors"
            >
              忘记密码？
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-text-400">
            由北京探微杜渐科技设计 · <a href="https://openpua.ai" target="_blank" className="text-accent-100 hover:underline">openpua.ai</a>
          </p>
        </div>
      </div>
    </div>
  )
}
