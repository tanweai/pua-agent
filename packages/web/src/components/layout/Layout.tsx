import { useState, useCallback } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ChatView } from '../chat/ChatView'
import { ArtifactPanel } from '../artifacts/ArtifactPanel'
import { FileDropZone } from '../input/FileDropZone'
import { SearchDialog } from '../ui/SearchDialog'
import { ToastContainer } from '../ui/ToastContainer'
import { useTheme } from '../../hooks/useTheme'
import { useConversation } from '../../hooks/useConversation'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useToast } from '../../hooks/useToast'
import { useAgentConfig } from '../../hooks/useAgentConfig'
import type { ArtifactFile } from '../../types/artifact'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeArtifact, setActiveArtifact] = useState<ArtifactFile | null>(null)
  const [puaMode, setPuaMode] = useState(() => {
    try { return localStorage.getItem('pua-mode') === 'true' } catch { return false }
  })

  const { mode, toggle: toggleTheme } = useTheme()
  const { toasts, show: showToast, dismiss: dismissToast } = useToast()
  const { agents: customAgents, updateAgents, agentSdkConfig } = useAgentConfig()
  const {
    conversations,
    activeId,
    messages,
    model,
    setModel,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateLastMessage,
    toggleThinkingBlock,
  } = useConversation()

  const handleNew = useCallback(() => {
    createConversation()
    setSidebarOpen(false)
  }, [createConversation])

  const handleEnsureConversation = useCallback(() => {
    if (!activeId) createConversation()
  }, [activeId, createConversation])

  const handleFileDrop = useCallback((files: File[]) => {
    showToast(`${files.length} file(s) added`, 'success')
  }, [showToast])

  const handleShowToast = useCallback((msg: string, type?: 'success' | 'error' | 'info') => {
    showToast(msg, type || 'success')
  }, [showToast])

  useKeyboardShortcuts({
    onNewChat: handleNew,
    onToggleSidebar: () => setSidebarOpen((v) => !v),
    onToggleTheme: toggleTheme,
    onSearch: () => setSearchOpen(true),
  })

  return (
    <div className="flex h-screen bg-bg-100 overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        themeMode={mode}
        isOpen={sidebarOpen}
        customAgents={customAgents}
        puaMode={puaMode}
        onSelect={(id) => { selectConversation(id); setSidebarOpen(false) }}
        onNew={handleNew}
        onDelete={deleteConversation}
        onToggleTheme={toggleTheme}
        onClose={() => setSidebarOpen(false)}
        onAgentsChange={updateAgents}
        onPuaModeChange={(v) => { setPuaMode(v); localStorage.setItem('pua-mode', String(v)) }}
      />

      <FileDropZone onDrop={handleFileDrop}>
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile header */}
          <div className="md:hidden flex items-center px-3 py-2 border-b border-border-100">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-bg-200 text-text-300">
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-text-100 ml-2">Claude Agent</span>
          </div>

          <div className="flex flex-1 min-h-0">
            <ChatView
              messages={messages}
              model={model}
              customAgents={agentSdkConfig}
              puaMode={puaMode}
              onAddMessage={addMessage}
              onUpdateLastMessage={updateLastMessage}
              onModelChange={setModel}
              onEnsureConversation={handleEnsureConversation}
              onToggleThinking={toggleThinkingBlock}
              onShowToast={handleShowToast}
            />

            {activeArtifact && (
              <ArtifactPanel
                artifact={activeArtifact}
                onClose={() => setActiveArtifact(null)}
              />
            )}
          </div>
        </div>
      </FileDropZone>

      <SearchDialog
        isOpen={searchOpen}
        conversations={conversations}
        onSelect={(id) => { selectConversation(id); setSearchOpen(false) }}
        onClose={() => setSearchOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
