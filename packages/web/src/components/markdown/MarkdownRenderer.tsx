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

// Build lookup: various name forms → CitationSource
function buildNameMap(citations: CitationSource[]): Map<string, CitationSource> {
  const map = new Map<string, CitationSource>()
  for (const c of citations) {
    const domain = c.domain.replace(/^www\./, '')
    map.set(domain.toLowerCase(), c)
    const short = domain.split('.')[0]
    if (short.length > 2) map.set(short.toLowerCase(), c)
    if (c.title.length > 3) map.set(c.title.toLowerCase(), c)
  }
  return map
}

// Detect [SourceName] bracket patterns and render as CitationChip
function renderWithBracketCitations(text: string, nameMap: Map<string, CitationSource>): any {
  // Match [Word] or [Two Words] or [Multi Word Source] patterns
  const bracketPattern = /\[([^\[\]]{2,40})\]/g
  const parts = text.split(bracketPattern)

  if (parts.length === 1) return text

  return parts.map((part, i) => {
    // Odd indices are the captured group content (inside brackets)
    if (i % 2 === 1) {
      const lower = part.toLowerCase()
      // Check if it matches a known source
      const source = nameMap.get(lower)
      if (source) {
        return <CitationChip key={i} source={source} />
      }
      // Try partial match (first word of source name)
      for (const [name, src] of nameMap) {
        if (name.includes(lower) || lower.includes(name)) {
          return <CitationChip key={i} source={src} />
        }
      }
      // Unknown bracket content — create a generic source chip
      if (part.length > 1 && part.length < 30 && !part.includes('(') && !part.match(/^\d/)) {
        return <CitationChip key={i} source={{ title: part, url: '', domain: part.toLowerCase(), snippet: '' }} />
      }
      // Not a source — render as original [text]
      return <Fragment key={i}>[{part}]</Fragment>
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
      p({ children }: any) {
        const processed = Array.isArray(children)
          ? children.map((child: any, i: number) => {
              if (typeof child === 'string') {
                return <Fragment key={i}>{renderWithBracketCitations(child, nameMap)}</Fragment>
              }
              return child
            })
          : typeof children === 'string'
            ? renderWithBracketCitations(children, nameMap)
            : children
        return <p>{processed}</p>
      },
      li({ children }: any) {
        const processed = Array.isArray(children)
          ? children.map((child: any, i: number) => {
              if (typeof child === 'string') {
                return <Fragment key={i}>{renderWithBracketCitations(child, nameMap)}</Fragment>
              }
              return child
            })
          : typeof children === 'string'
            ? renderWithBracketCitations(children, nameMap)
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
