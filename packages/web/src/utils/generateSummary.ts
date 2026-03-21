export function generateThinkingSummary(text: string): string {
  const firstLine = text.split('\n').find((l) => l.trim()) || ''
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '...' : firstLine
}
