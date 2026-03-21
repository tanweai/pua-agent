import { useMemo, Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import { CitationRef, type CitationSource } from '../blocks/CitationRef'

interface Props {
  content: string
  isStreaming?: boolean
  citations?: Map<number, CitationSource>
}

// Split text to extract [^cite:N] markers and render CitationRef inline
function renderWithCitations(text: string, citations: Map<number, CitationSource>) {
  if (!citations.size) return text

  const parts = text.split(/(\[\^cite:\d+\])/)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    const match = part.match(/\[\^cite:(\d+)\]/)
    if (match) {
      const num = parseInt(match[1])
      const source = citations.get(num)
      if (source) {
        return <CitationRef key={i} number={num} source={source} />
      }
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function MarkdownRenderer({ content, isStreaming, citations = new Map() }: Props) {
  const components = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        if (!match) {
          return <code className={className} {...props}>{children}</code>
        }
        return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
      },
      // Handle paragraphs to inject citation refs
      p({ children }: any) {
        if (citations.size === 0) return <p>{children}</p>

        // Process text children for citation markers
        const processed = Array.isArray(children)
          ? children.map((child: any, i: number) => {
              if (typeof child === 'string') {
                return <Fragment key={i}>{renderWithCitations(child, citations)}</Fragment>
              }
              return child
            })
          : typeof children === 'string'
            ? renderWithCitations(children, citations)
            : children

        return <p>{processed}</p>
      },
    }),
    [citations],
  )

  return (
    <div className={isStreaming ? 'streaming-cursor' : ''}>
      <ReactMarkdown className="markdown-body" remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
