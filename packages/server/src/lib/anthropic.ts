import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    client = new Anthropic({
      apiKey,
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    })
  }
  return client
}

// Model mapping: ZhiPu maps these Claude model IDs server-side
// claude-opus-4-6 → GLM-5
// claude-sonnet-4-6 → GLM-4.7
// claude-haiku-4-5 → GLM-4.5-Air
export const MODEL_MAP: Record<string, string> = {
  'claude-opus-4-6-20250514': 'claude-opus-4-6-20250514',
  'claude-sonnet-4-6-20250514': 'claude-sonnet-4-6-20250514',
  'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
  'claude-opus-4-6': 'claude-opus-4-6',
  'claude-sonnet-4-6': 'claude-sonnet-4-6',
  'claude-haiku-4-5': 'claude-haiku-4-5',
}
