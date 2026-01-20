export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/tools`, {
    query: { env: query.env },
    headers: {
      'x-admin-key': config.adminKey,
    },
  })
  
  return response
})
