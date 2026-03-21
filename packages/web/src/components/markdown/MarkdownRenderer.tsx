import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

interface Props {
  content: string
  isStreaming?: boolean
}

export function MarkdownRenderer({ content, isStreaming }: Props) {
  const components = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        if (!match) {
          return <code className={className} {...props}>{children}</code>
        }
        return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
      },
    }),
    [],
  )

  return (
    <div className={isStreaming ? 'streaming-cursor' : ''}>
      <ReactMarkdown className="markdown-body" remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
