import { useState } from 'react'
import { Plus, Search, MessageSquare, Trash2, Sun, Moon, Menu, X, Flame, QrCode, LogOut } from 'lucide-react'
import { AgentConfig } from '../settings/AgentConfig'
import type { AgentDefinition } from '../settings/AgentConfig'
import type { Conversation } from '../../types/conversation'
import type { ThemeMode } from '../../hooks/useTheme'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  themeMode: ThemeMode
  isOpen: boolean
  customAgents: AgentDefinition[]
  puaMode: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onToggleTheme: () => void
  onClose: () => void
  onAgentsChange: (agents: AgentDefinition[]) => void
  onPuaModeChange: (enabled: boolean) => void
  onQRConnect: () => void
  username?: string | null
  onLogout?: () => void
}

function groupByDate(conversations: Conversation[]) {
  const now = Date.now()
  const day = 86400000
  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older', items: [] },
  ]

  for (const conv of conversations) {
    const age = now - conv.updatedAt
    if (age < day) groups[0].items.push(conv)
    else if (age < 2 * day) groups[1].items.push(conv)
    else if (age < 7 * day) groups[2].items.push(conv)
    else groups[3].items.push(conv)
  }

  return groups.filter((g) => g.items.length > 0)
}

export function Sidebar({ conversations, activeId, themeMode, isOpen, customAgents, puaMode, onSelect, onNew, onDelete, onToggleTheme, onClose, onAgentsChange, onPuaModeChange, onQRConnect, username, onLogout }: Props) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations
  const groups = groupByDate(filtered)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        w-64 bg-bg-200 flex flex-col h-full border-r border-border-100 shrink-0
        fixed md:relative z-50 md:z-auto
        transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-300 text-text-300 md:hidden">
            <X size={18} />
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={onQRConnect} className="p-1.5 rounded-lg hover:bg-bg-300 text-text-300 transition-colors" title="手机扫码连接">
              <QrCode size={16} />
            </button>
            <button onClick={onToggleTheme} className="p-1.5 rounded-lg hover:bg-bg-300 text-text-300 transition-colors">
              {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button onClick={onNew} className="p-1.5 rounded-lg hover:bg-bg-300 text-text-300 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-bg-300 rounded-lg">
            <Search size={14} className="text-text-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="bg-transparent outline-none text-sm text-text-100 placeholder:text-text-400 w-full"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="text-[11px] font-medium text-text-400 uppercase tracking-wider px-2 py-1.5">
                {group.label}
              </p>
              {group.items.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => { onSelect(conv.id); onClose() }}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    conv.id === activeId
                      ? 'bg-bg-300 text-text-100 font-medium'
                      : 'text-text-200 hover:bg-bg-300/60'
                  }`}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate text-sm flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-error transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-text-400 text-xs text-center py-8">No conversations yet</p>
          )}

          {/* PUA Mode toggle */}
          <div className="border-t border-border-100 mt-2 pt-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-bg-300/60 rounded-lg transition-colors"
              onClick={() => onPuaModeChange(!puaMode)}
            >
              <Flame size={14} className={puaMode ? 'text-orange-500' : 'text-text-400'} />
              <span className={`text-[12px] font-medium ${puaMode ? 'text-orange-500' : 'text-text-300'}`}>
                PUA Mode
              </span>
              <div className="flex-1" />
              <div className={`w-8 h-4 rounded-full transition-colors ${puaMode ? 'bg-orange-500' : 'bg-bg-300'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform mt-[1px] ${puaMode ? 'translate-x-[17px]' : 'translate-x-[1px]'}`} />
              </div>
            </div>
            {puaMode && (
              <p className="text-[10px] text-orange-500/70 px-3 py-1">P7/P9/P10 Agent Team enabled</p>
            )}
          </div>

          {/* Custom Agents config */}
          <AgentConfig agents={customAgents} onChange={onAgentsChange} />

          {/* User info + Logout */}
          {username && (
            <div className="border-t border-border-100 mt-2 pt-2 px-3 py-2 flex items-center justify-between">
              <span className="text-[12px] text-text-300 truncate">{username}</span>
              <button
                onClick={onLogout}
                className="p-1 rounded-lg hover:bg-bg-300 text-text-400 hover:text-error transition-colors"
                title="登出"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
