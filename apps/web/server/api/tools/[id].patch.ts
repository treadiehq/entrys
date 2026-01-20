export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/tools/${id}`, {
    method: 'PATCH',
    body,
    headers: {
      'x-admin-key': config.adminKey,
      'Content-Type': 'application/json',
    },
  })
  
  return response
})
