export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  try {
    const response = await $fetch(`${config.apiUrl}/v1/login`, {
      method: 'POST',
      body,
    })
    return response
  } catch (error: any) {
    // Don't leak internal URLs - use data.message if available, otherwise generic error
    const message = error.data?.message || 'Login failed. Please try again.'
    throw createError({
      statusCode: error.statusCode || 500,
      message,
    })
  }
})
