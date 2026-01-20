export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  
  const response = await $fetch(`${config.public.apiUrl}/v1/tools/${id}/deactivate`, {
    method: 'POST',
    headers: {
      'x-admin-key': process.env.ADMIN_KEY || 'dev-admin-key',
    },
  })
  
  return response
})
