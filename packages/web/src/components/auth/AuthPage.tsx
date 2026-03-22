import { useState } from 'react'
import { Flame, ArrowRight, UserPlus, LogIn } from 'lucide-react'

interface Props {
  onLogin: (username: string, password: string) => Promise<any>
  onRegister: (username: string, password: string, inviteCode: string) => Promise<any>
}

export function AuthPage({ onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await onLogin(username, password)
      } else {
        await onRegister(username, password, inviteCode)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="flex rounded-xl bg-bg-200 p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
              mode === 'login' ? 'bg-bg-100 text-text-100 shadow-sm' : 'text-text-400'
            }`}
          >
            <LogIn size={14} />
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
              mode === 'register' ? 'bg-bg-100 text-text-100 shadow-sm' : 'text-text-400'
            }`}
          >
            <UserPlus size={14} />
            注册
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[12px] text-text-300 mb-1.5">邀请码</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="请输入邀请码"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border-200 bg-bg-100 text-[14px] text-text-100 placeholder:text-text-400 outline-none focus:border-accent-100 transition-colors"
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
              className="w-full px-3 py-2.5 rounded-xl border border-border-200 bg-bg-100 text-[14px] text-text-100 placeholder:text-text-400 outline-none focus:border-accent-100 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] text-text-300 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-xl border border-border-200 bg-bg-100 text-[14px] text-text-100 placeholder:text-text-400 outline-none focus:border-accent-100 transition-colors"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-[13px] text-error">
              {error}
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
                {mode === 'login' ? '登录' : '注册'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
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
