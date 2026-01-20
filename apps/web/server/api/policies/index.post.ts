export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/policies`, {
    method: 'POST',
    body,
    headers: {
      'x-admin-key': config.adminKey,
      'Content-Type': 'application/json',
    },
  })
  
  return response
})
