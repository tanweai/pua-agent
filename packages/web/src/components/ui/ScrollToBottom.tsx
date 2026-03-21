import { ArrowDown } from 'lucide-react'

interface Props {
  visible: boolean
  onClick: () => void
}

export function ScrollToBottom({ visible, onClick }: Props) {
  if (!visible) return null

  return (
    <button
      onClick={onClick}
      className="scroll-btn-enter pointer-events-auto w-9 h-9 rounded-full bg-bg-100 border border-border-200 shadow-md flex items-center justify-center text-text-300 hover:text-text-100 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <ArrowDown size={16} />
    </button>
  )
}
