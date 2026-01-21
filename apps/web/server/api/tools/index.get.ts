export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/tools`, {
    query: { env: query.env, teamId: query.teamId },
    headers: {
      'x-admin-key': config.adminKey,
    },
    timeout: 10000,
  })
  
  return response
})
