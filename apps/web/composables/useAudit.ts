import type { AuditLogResponse, AuditLogQuery } from '@entrys/shared'

export function useAudit() {
  const { fetchApi } = useApi()
  
  const logs = useState<AuditLogResponse[]>('auditLogs', () => [])
  const loading = useState('auditLoading', () => false)
  
  async function loadLogs(query: Omit<AuditLogQuery, 'env'> = {}) {
    loading.value = true
    try {
      logs.value = await fetchApi<AuditLogResponse[]>('/audit', { query })
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      loading.value = false
    }
  }
  
  return {
    logs,
    loading,
    loadLogs,
  }
}
