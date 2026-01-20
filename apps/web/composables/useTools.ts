import type { ToolResponse, CreateToolDto, UpdateToolDto } from '@entrys/shared'

export function useTools() {
  const { fetchApi } = useApi()
  
  const tools = useState<ToolResponse[]>('tools', () => [])
  const loading = useState('toolsLoading', () => false)
  
  async function loadTools(logicalName?: string) {
    loading.value = true
    try {
      const query = logicalName ? `?logicalName=${logicalName}` : ''
      tools.value = await fetchApi<ToolResponse[]>(`/tools${query}`)
    } catch (err) {
      console.error('Failed to load tools:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function createTool(dto: CreateToolDto) {
    const tool = await fetchApi<ToolResponse>('/tools', {
      method: 'POST',
      body: dto,
    })
    tools.value = [tool, ...tools.value]
    return tool
  }
  
  async function updateTool(id: string, dto: UpdateToolDto) {
    const tool = await fetchApi<ToolResponse>(`/tools/${id}`, {
      method: 'PATCH',
      body: dto,
    })
    const index = tools.value.findIndex(t => t.id === id)
    if (index >= 0) {
      tools.value[index] = tool
    }
    return tool
  }
  
  async function deleteTool(id: string) {
    await fetchApi(`/tools/${id}`, { method: 'DELETE' })
    tools.value = tools.value.filter(t => t.id !== id)
  }

  // Activate a tool version (deactivates other versions)
  async function activateTool(id: string) {
    const tool = await fetchApi<ToolResponse>(`/tools/${id}/activate`, {
      method: 'POST',
    })
    // Update local state - set this one active, others with same logicalName inactive
    tools.value = tools.value.map(t => {
      if (t.id === id) return { ...t, isActive: true }
      if (t.logicalName === tool.logicalName) return { ...t, isActive: false }
      return t
    })
    return tool
  }

  // Deactivate a tool version
  async function deactivateTool(id: string) {
    const tool = await fetchApi<ToolResponse>(`/tools/${id}/deactivate`, {
      method: 'POST',
    })
    const index = tools.value.findIndex(t => t.id === id)
    if (index >= 0) {
      tools.value[index] = { ...tools.value[index], isActive: false }
    }
    return tool
  }

  // Group tools by logicalName for UI display
  const toolsByLogicalName = computed(() => {
    const grouped: Record<string, ToolResponse[]> = {}
    for (const tool of tools.value) {
      if (!grouped[tool.logicalName]) {
        grouped[tool.logicalName] = []
      }
      grouped[tool.logicalName].push(tool)
    }
    // Sort versions within each group
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => b.version.localeCompare(a.version))
    }
    return grouped
  })
  
  return {
    tools,
    toolsByLogicalName,
    loading,
    loadTools,
    createTool,
    updateTool,
    deleteTool,
    activateTool,
    deactivateTool,
  }
}
