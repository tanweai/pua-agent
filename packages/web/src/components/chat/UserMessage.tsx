import { Pencil, RefreshCw } from 'lucide-react'
import type { Message } from '../../types/message'

interface Props {
  message: Message
}

export function UserMessage({ message }: Props) {
  return (
    <div className="group message-enter">
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative rounded-2xl bg-bg-150 px-4 py-3">
          <p className="text-sm leading-relaxed text-text-100 whitespace-pre-wrap">
            {message.content}
          </p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 bg-bg-200 rounded-lg text-xs text-text-300">
                  <span className="truncate max-w-[120px]">{a.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="absolute -bottom-6 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button className="p-1 rounded hover:bg-bg-200 text-text-400 hover:text-text-200">
              <Pencil size={14} />
            </button>
            <button className="p-1 rounded hover:bg-bg-200 text-text-400 hover:text-text-200">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
