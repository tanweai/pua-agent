import { useState } from 'react'
import { ArrowLeft, Key, Trash2, Info, ExternalLink } from 'lucide-react'

interface Props {
  isOpen: boolean
  username: string
  onClose: () => void
  onLogout: () => void
}

export function SettingsPanel({ isOpen, username, onClose, onLogout }: Props) {
  const [tab, setTab] = useState<'about' | 'password' | 'delete'>('about')
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [delPwd, setDelPwd] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const token = localStorage.getItem('pua-agent-token')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('密码已修改'); setMsgType('success')
      setOldPwd(''); setNewPwd('')
    } catch (err: any) {
      setMsg(err.message); setMsgType('error')
    } finally { setLoading(false) }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirm('确定要删除账号吗？此操作不可撤销！')) return
    setMsg(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: delPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onLogout()
    } catch (err: any) {
      setMsg(err.message); setMsgType('error')
    } finally { setLoading(false) }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border-200 bg-bg-100 text-[14px] text-text-100 placeholder:text-text-400 outline-none focus:border-accent-100 transition-colors"

  const tabs = [
    { key: 'about' as const, label: '关于', icon: Info },
    { key: 'password' as const, label: '修改密码', icon: Key },
    { key: 'delete' as const, label: '删除账号', icon: Trash2 },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-bg-100 flex">
      {/* Left sidebar nav */}
      <div className="w-64 border-r border-border-100 bg-bg-150 flex flex-col">
        <div className="px-4 py-5">
          <button onClick={onClose} className="flex items-center gap-2 text-[13px] text-text-300 hover:text-text-100 transition-colors mb-6">
            <ArrowLeft size={16} />
            返回
          </button>
          <h2 className="text-lg font-semibold text-text-100">设置</h2>
          <p className="text-[12px] text-text-400 mt-1">{username}</p>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setMsg('') }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                tab === t.key
                  ? 'bg-accent-100/10 text-accent-100 font-medium'
                  : 'text-text-300 hover:bg-bg-200 hover:text-text-100'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-border-100">
          <p className="text-[10px] text-text-400">PUA Agent v1.0.0</p>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-8 py-10">
          {/* About */}
          {tab === 'about' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-text-100 mb-2">关于 PUA Agent</h3>
                <p className="text-[14px] text-text-300 leading-relaxed">
                  专为个人生产力放大而设计的 AI Agent。拥有合伙人般的能动性和效率，在安全的基础上帮助个人放大生产价值。
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-150 border border-border-100">
                  <img src="/pua-logo.svg" alt="PUA" className="w-12 h-12" />
                  <div>
                    <h4 className="text-[15px] font-medium text-text-100">PUA Agent</h4>
                    <p className="text-[12px] text-text-400">版本 1.0.0</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-bg-150 border border-border-100">
                    <p className="text-[11px] text-text-400 mb-1">当前用户</p>
                    <p className="text-[14px] text-text-100 font-medium">{username}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-150 border border-border-100">
                    <p className="text-[11px] text-text-400 mb-1">开发者</p>
                    <p className="text-[14px] text-text-100 font-medium">北京探微杜渐科技</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-bg-150 border border-border-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-text-400 mb-1">官方网站</p>
                    <p className="text-[14px] text-text-100 font-medium">openpua.ai</p>
                  </div>
                  <a href="https://openpua.ai" target="_blank" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-100 text-white text-[12px] hover:opacity-90">
                    访问 <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Change Password */}
          {tab === 'password' && (
            <div>
              <h3 className="text-xl font-semibold text-text-100 mb-2">修改密码</h3>
              <p className="text-[13px] text-text-400 mb-6">修改你的登录密码。修改后需要重新登录。</p>

              <form onSubmit={handleChangePassword} className="space-y-5 max-w-sm">
                <div>
                  <label className="block text-[13px] text-text-300 mb-2">原密码</label>
                  <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="输入原密码" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] text-text-300 mb-2">新密码</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="输入新密码（至少6位）" required minLength={6} className={inputClass} />
                </div>
                {msg && <p className={`text-[13px] px-3 py-2 rounded-lg ${msgType === 'error' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>{msg}</p>}
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-accent-100 text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-50">
                  {loading ? '修改中...' : '修改密码'}
                </button>
              </form>
            </div>
          )}

          {/* Delete Account */}
          {tab === 'delete' && (
            <div>
              <h3 className="text-xl font-semibold text-error mb-2">删除账号</h3>
              <p className="text-[13px] text-text-400 mb-6">永久删除你的账号和所有数据。此操作不可撤销。</p>

              <div className="p-4 rounded-xl bg-error/5 border border-error/20 mb-6">
                <p className="text-[13px] text-error leading-relaxed">
                  删除账号后，你的所有对话记录、设置和个人数据将被永久清除，无法恢复。请谨慎操作。
                </p>
              </div>

              <form onSubmit={handleDeleteAccount} className="space-y-5 max-w-sm">
                <div>
                  <label className="block text-[13px] text-text-300 mb-2">输入密码确认</label>
                  <input type="password" value={delPwd} onChange={e => setDelPwd(e.target.value)} placeholder="输入当前密码以确认删除" required className={inputClass} />
                </div>
                {msg && <p className="text-[13px] px-3 py-2 rounded-lg bg-error/10 text-error">{msg}</p>}
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-error text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-50">
                  {loading ? '删除中...' : '永久删除账号'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
