export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  
  const response = await $fetch(`${config.apiUrl}/v1/agent-keys/${id}/revoke`, {
    method: 'POST',
    headers: {
      'x-admin-key': config.adminKey,
    },
  })
  
  return response
})
