export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/audit`, {
    query,
    headers: {
      'x-admin-key': config.adminKey,
    },
  })
  
  return response
})
