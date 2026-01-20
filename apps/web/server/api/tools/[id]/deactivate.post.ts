export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const config = useRuntimeConfig()
  
  const response = await $fetch(`${config.apiUrl}/v1/tools/${id}/deactivate`, {
    method: 'POST',
    query: { teamId: query.teamId },
    headers: {
      'x-admin-key': config.adminKey,
    },
  })
  
  return response
})
