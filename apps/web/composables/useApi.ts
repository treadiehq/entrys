export function useApi() {
  const env = useState<'staging' | 'prod'>('currentEnv', () => 'staging')
  
  async function fetchApi<T>(
    endpoint: string, 
    options: { 
      method?: string
      body?: unknown
      query?: Record<string, string | number | undefined>
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, query } = options
    
    // Build query string with env
    const queryParams = new URLSearchParams()
    if (endpoint.includes('env=') === false && !endpoint.startsWith('/api/envs')) {
      queryParams.set('env', env.value)
    }
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          queryParams.set(key, String(value))
        }
      }
    }
    
    const queryString = queryParams.toString()
    const url = `/api${endpoint}${queryString ? `?${queryString}` : ''}`
    
    const response = await $fetch<T>(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
    })
    
    return response
  }
  
  return {
    env,
    fetchApi,
  }
}
