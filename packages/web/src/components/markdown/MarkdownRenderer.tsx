import { useMemo, Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import { CitationChip, type CitationSource } from '../blocks/CitationRef'

interface Props {
  content: string
  isStreaming?: boolean
  citations?: CitationSource[]
}

// Replace URLs in text with CitationChip if matching a known citation source
function renderTextWithCitations(text: string, citations: CitationSource[]) {
  if (!citations.length) return text

  // Find URLs in text
  const urlRegex = /(https?:\/\/[^\s),。；！？]+)/g
  const parts = text.split(urlRegex)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    if (urlRegex.test(part) || part.startsWith('http')) {
      // Check if this URL matches a citation source
      const source = citations.find(c => part.includes(c.domain))
      if (source) {
        return <CitationChip key={i} source={source} />
      }
      // Unknown URL — render as plain link
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="text-accent-100 hover:text-accent-200 underline">
          {part}
        </a>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function MarkdownRenderer({ content, isStreaming, citations = [] }: Props) {
  const components = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        if (!match) {
          return <code className={className} {...props}>{children}</code>
        }
        return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
      },
      // Handle links — replace with CitationChip if matching source
      a({ href, children }: any) {
        if (href && citations.length) {
          const source = citations.find(c => href.includes(c.domain))
          if (source) {
            return <CitationChip source={source} />
          }
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-accent-100 hover:text-accent-200 underline">
            {children}
          </a>
        )
      },
      // Handle paragraphs — detect inline URLs
      p({ children }: any) {
        if (!citations.length) return <p>{children}</p>
        const processed = Array.isArray(children)
          ? children.map((child: any, i: number) => {
              if (typeof child === 'string') {
                return <Fragment key={i}>{renderTextWithCitations(child, citations)}</Fragment>
              }
              return child
            })
          : typeof children === 'string'
            ? renderTextWithCitations(children, citations)
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
