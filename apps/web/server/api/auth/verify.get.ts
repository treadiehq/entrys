export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    const response = await $fetch(`${config.apiUrl}/v1/verify`, {
      query: { token: query.token },
    })
    return response
  } catch (error: any) {
    const message = error.data?.message || error.message || 'Verification failed'
    throw createError({
      statusCode: error.statusCode || 400,
      message,
    })
  }
})
