export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const start = Date.now()
  const response = await $fetch(`${config.apiUrl}/v1/agent-keys`, {
    query: { env: query.env, teamId: query.teamId },
    headers: {
      'x-admin-key': config.adminKey,
    },
    timeout: 10000,
  })
  console.log(`[agent-keys] Backend responded in ${Date.now() - start}ms`)
  
  return response
})
