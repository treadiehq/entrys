export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const response = await $fetch(`${config.apiUrl}/v1/logout`, {
    method: 'POST',
    body,
  })
  
  return response
})
