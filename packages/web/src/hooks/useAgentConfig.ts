import { useState, useCallback, useMemo } from 'react'
import type { AgentDefinition } from '../components/settings/AgentConfig'

const STORAGE_KEY = 'pua-agent-custom-agents'

function loadAgents(): AgentDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useAgentConfig() {
  const [agents, setAgents] = useState<AgentDefinition[]>(loadAgents)

  const updateAgents = useCallback((newAgents: AgentDefinition[]) => {
    setAgents(newAgents)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAgents))
  }, [])

  // Convert to Agent SDK format for API request
  const agentSdkConfig = useMemo(() => {
    const config: Record<string, { description: string; prompt?: string; tools?: string[]; model?: string; maxTurns?: number }> = {}
    for (const a of agents) {
      if (a.enabled && a.name) {
        config[a.name] = {
          description: a.description,
          ...(a.prompt && { prompt: a.prompt }),
          ...(a.tools.length > 0 && { tools: a.tools }),
          ...(a.model && a.model !== 'inherit' && { model: a.model }),
          ...(a.maxTurns && a.maxTurns !== 10 && { maxTurns: a.maxTurns }),
        }
      }
    }
    return config
  }, [agents])

  return { agents, updateAgents, agentSdkConfig }
}
