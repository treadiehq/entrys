export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  try {
    const response = await $fetch(`${config.apiUrl}/v1/signup`, {
      method: 'POST',
      body,
    })
    return response
  } catch (error: any) {
    const message = error.data?.message || error.message || 'Signup failed'
    throw createError({
      statusCode: error.statusCode || 400,
      message,
    })
  }
})
