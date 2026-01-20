export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  
  const response = await $fetch(`${config.apiUrl}/v1/policies/${id}`, {
    method: 'DELETE',
    headers: {
      'x-admin-key': config.adminKey,
    },
  })
  
  return response
})
