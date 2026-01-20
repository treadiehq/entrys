import type { AgentKeyResponse, AgentKeyCreatedResponse, CreateAgentKeyDto } from '@entrys/shared'

export function useAgents() {
  const { fetchApi } = useApi()
  
  const agents = useState<AgentKeyResponse[]>('agents', () => [])
  const loading = useState('agentsLoading', () => false)
  
  async function loadAgents() {
    loading.value = true
    try {
      agents.value = await fetchApi<AgentKeyResponse[]>('/agent-keys')
    } catch (err) {
      console.error('Failed to load agents:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function createAgent(dto: CreateAgentKeyDto): Promise<AgentKeyCreatedResponse> {
    const agent = await fetchApi<AgentKeyCreatedResponse>('/agent-keys', {
      method: 'POST',
      body: dto,
    })
    agents.value = [agent, ...agents.value]
    return agent
  }
  
  async function revokeAgent(id: string) {
    await fetchApi(`/agent-keys/${id}/revoke`, { method: 'POST' })
    const index = agents.value.findIndex(a => a.id === id)
    if (index >= 0) {
      agents.value[index] = { ...agents.value[index], isRevoked: true }
    }
  }
  
  return {
    agents,
    loading,
    loadAgents,
    createAgent,
    revokeAgent,
  }
}
