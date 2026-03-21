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

// Build a lookup: source display names → CitationSource
function buildNameMap(citations: CitationSource[]): Map<string, CitationSource> {
  const map = new Map<string, CitationSource>()
  for (const c of citations) {
    // Add domain variants
    const domain = c.domain.replace(/^www\./, '')
    map.set(domain, c)
    // Short name from domain (e.g., "reuters" from "reuters.com")
    const short = domain.split('.')[0]
    if (short.length > 2) map.set(short, c)
    // Title as key (for exact match)
    if (c.title.length > 3) map.set(c.title, c)
  }
  return map
}

// Replace source name mentions in text with CitationChip
function renderTextWithCitations(text: string, nameMap: Map<string, CitationSource>): any {
  if (!nameMap.size) return text

  // Build regex from all source names, longest first to avoid partial matches
  const names = Array.from(nameMap.keys())
    .filter(n => n.length > 2)
    .sort((a, b) => b.length - a.length)

  if (!names.length) return text

  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(pattern)

  if (parts.length === 1) return text

  const usedSources = new Set<string>()
  return parts.map((part, i) => {
    const lower = part.toLowerCase()
    // Check if this part matches a source name
    for (const [name, source] of nameMap) {
      if (lower === name.toLowerCase() && !usedSources.has(part + i)) {
        usedSources.add(part + i)
        return <CitationChip key={i} source={source} />
      }
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function MarkdownRenderer({ content, isStreaming, citations = [] }: Props) {
  const nameMap = useMemo(() => buildNameMap(citations), [citations])

  const components = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        if (!match) {
          return <code className={className} {...props}>{children}</code>
        }
        return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
      },
      // Links — replace with CitationChip if matching source
      a({ href, children }: any) {
        if (href && citations.length) {
          const source = citations.find(c => href.includes(c.domain))
          if (source) return <CitationChip source={source} />
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-accent-100 hover:text-accent-200 underline">
            {children}
          </a>
        )
      },
      // Paragraphs — detect source name mentions inline
      p({ children }: any) {
        if (!nameMap.size) return <p>{children}</p>
        const processed = Array.isArray(children)
          ? children.map((child: any, i: number) => {
              if (typeof child === 'string') {
                return <Fragment key={i}>{renderTextWithCitations(child, nameMap)}</Fragment>
              }
              return child
            })
          : typeof children === 'string'
            ? renderTextWithCitations(children, nameMap)
            : children
        return <p>{processed}</p>
      },
      // List items — also detect source names
      li({ children }: any) {
        if (!nameMap.size) return <li>{children}</li>
        const processed = Array.isArray(children)
          ? children.map((child: any, i: number) => {
              if (typeof child === 'string') {
                return <Fragment key={i}>{renderTextWithCitations(child, nameMap)}</Fragment>
              }
              return child
            })
          : typeof children === 'string'
            ? renderTextWithCitations(children, nameMap)
            : children
        return <li>{processed}</li>
      },
    }),
    [citations, nameMap],
  )

  return (
    <div className={isStreaming ? 'streaming-cursor' : ''}>
      <ReactMarkdown className="markdown-body" remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
