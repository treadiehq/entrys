export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/me`, {
    query: { sessionToken: query.sessionToken },
  })
  
  return response
})
