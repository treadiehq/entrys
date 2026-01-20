export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const body = await readBody(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/tools`, {
    method: 'POST',
    query: { env: query.env },
    body,
    headers: {
      'x-admin-key': config.adminKey,
      'Content-Type': 'application/json',
    },
  })
  
  return response
})
