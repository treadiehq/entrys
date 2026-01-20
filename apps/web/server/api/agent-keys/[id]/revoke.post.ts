export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/agent-keys/${id}/revoke`, {
    method: 'POST',
    query: { teamId: query.teamId },
    headers: {
      'x-admin-key': config.adminKey,
    },
  })
  
  return response
})
