export interface ArtifactFile {
  id: string
  filename: string
  extension: 'jsx' | 'tsx' | 'html' | 'md' | 'mermaid' | 'svg' | 'css' | 'py' | 'js' | 'ts'
  content: string
  title: string
  isStreaming: boolean
  version: number
  versions: string[]
}
