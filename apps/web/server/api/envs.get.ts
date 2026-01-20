export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const response = await $fetch(`${config.apiUrl}/v1/envs`, {
    headers: {
      'x-admin-key': config.adminKey,
    },
  })
  
  return response
})
