export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const body = await readBody(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/tools/${id}`, {
    method: 'PATCH',
    query: { teamId: query.teamId },
    body,
    headers: {
      'x-admin-key': config.adminKey,
      'Content-Type': 'application/json',
    },
  })
  
  return response
})
