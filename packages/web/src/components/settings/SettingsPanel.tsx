import { useState } from 'react'
import { X, Key, Trash2, Info, ExternalLink } from 'lucide-react'

interface Props {
  isOpen: boolean
  username: string
  onClose: () => void
  onLogout: () => void
}

export function SettingsPanel({ isOpen, username, onClose, onLogout }: Props) {
  const [tab, setTab] = useState<'password' | 'delete' | 'about'>('about')
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

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border-200 bg-bg-100 text-[13px] text-text-100 placeholder:text-text-400 outline-none focus:border-accent-100"

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-bg-100 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 pointer-events-auto dialog-enter overflow-hidden max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-100">
            <h3 className="text-[15px] font-medium text-text-100">设置</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-200 text-text-400">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border-100">
            {([
              { key: 'about', label: '关于', icon: Info },
              { key: 'password', label: '修改密码', icon: Key },
              { key: 'delete', label: '删除账号', icon: Trash2 },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setMsg('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] transition-colors ${
                  tab === t.key ? 'text-accent-100 border-b-2 border-accent-100' : 'text-text-400 hover:text-text-200'
                }`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5">
            {/* About */}
            {tab === 'about' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src="/pua-logo.svg" alt="PUA" className="w-10 h-10" />
                  <div>
                    <h4 className="text-[14px] font-medium text-text-100">PUA Agent</h4>
                    <p className="text-[11px] text-text-400">v1.0.0</p>
                  </div>
                </div>
                <p className="text-[13px] text-text-300 leading-relaxed">
                  专为个人生产力放大而设计的 AI Agent。拥有合伙人般的能动性和效率，在安全的基础上帮助个人放大生产价值。
                </p>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-text-400">当前用户</span>
                    <span className="text-text-200">{username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-400">开发者</span>
                    <span className="text-text-200">北京探微杜渐科技</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-400">官方网站</span>
                    <a href="https://openpua.ai" target="_blank" className="text-accent-100 hover:underline flex items-center gap-1">
                      openpua.ai <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Change Password */}
            {tab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-text-400 mb-1">原密码</label>
                  <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="输入原密码" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] text-text-400 mb-1">新密码</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="输入新密码（至少6位）" required minLength={6} className={inputClass} />
                </div>
                {msg && <p className={`text-[12px] ${msgType === 'error' ? 'text-error' : 'text-success'}`}>{msg}</p>}
                <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-accent-100 text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50">
                  {loading ? '修改中...' : '修改密码'}
                </button>
              </form>
            )}

            {/* Delete Account */}
            {tab === 'delete' && (
              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <div className="px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-[12px] text-error">
                  删除账号后，所有数据将被永久清除，此操作不可撤销。
                </div>
                <div>
                  <label className="block text-[11px] text-text-400 mb-1">输入密码确认</label>
                  <input type="password" value={delPwd} onChange={e => setDelPwd(e.target.value)} placeholder="输入密码确认删除" required className={inputClass} />
                </div>
                {msg && <p className="text-[12px] text-error">{msg}</p>}
                <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-error text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50">
                  {loading ? '删除中...' : '永久删除账号'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
