import type { ToolAliasResponse, CreateToolAliasDto } from '@entrys/shared'

export function useAliases() {
  const { fetchApi } = useApi()
  
  const aliases = ref<ToolAliasResponse[]>([])
  const loading = ref(false)
  
  async function loadAliases() {
    loading.value = true
    try {
      aliases.value = await fetchApi<ToolAliasResponse[]>('/aliases')
    } catch (err) {
      console.error('Failed to load aliases:', err)
      aliases.value = []
    } finally {
      loading.value = false
    }
  }
  
  async function createAlias(dto: CreateToolAliasDto) {
    const result = await fetchApi<ToolAliasResponse>('/aliases', {
      method: 'POST',
      body: dto,
    })
    aliases.value.push(result)
    return result
  }
  
  async function deleteAlias(id: string) {
    await fetchApi(`/aliases/${id}`, { method: 'DELETE' })
    aliases.value = aliases.value.filter(a => a.id !== id)
  }
  
  return {
    aliases,
    loading,
    loadAliases,
    createAlias,
    deleteAlias,
  }
}
