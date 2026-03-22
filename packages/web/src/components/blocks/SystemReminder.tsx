import { AlertCircle } from 'lucide-react'

interface Props {
  content: string
}

export function SystemReminder({ content }: Props) {
  return (
    <div className="my-3 rounded-lg border-l-[3px] px-3.5 py-2.5" style={{ borderColor: '#e8453c', background: 'rgba(232, 69, 60, 0.05)' }}>
      <div className="flex items-start gap-2">
        <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#e8453c' }} />
        <div className="text-[13px] leading-[1.6] whitespace-pre-wrap" style={{ color: '#e8453c' }}>
          {content}
        </div>
      </div>
    </div>
  )
}

// Extract <system-reminder> blocks from text
export function extractSystemReminders(text: string): { cleanText: string; reminders: string[] } {
  const reminders: string[] = []
  const cleanText = text.replace(/<system-reminder>\s*([\s\S]*?)\s*<\/system-reminder>/g, (_match, content) => {
    reminders.push(content.trim())
    return ''
  })
  return { cleanText: cleanText.trim(), reminders }
}
