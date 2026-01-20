export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const body = await readBody(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/agent-keys`, {
    method: 'POST',
    query: { env: query.env, teamId: query.teamId },
    body,
    headers: {
      'x-admin-key': config.adminKey,
      'Content-Type': 'application/json',
    },
  })
  
  return response
})
