<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

useHead({
  title: 'Verifying - Entrys'
})

const { fetchApi } = useApi()
const { saveToStorage } = useAuth()
const route = useRoute()

const status = ref<'loading' | 'success' | 'error'>('loading')
const error = ref('')

onMounted(async () => {
  const token = route.query.token as string
  
  if (!token) {
    status.value = 'error'
    error.value = 'Invalid verification link'
    return
  }

  try {
    const response = await fetchApi<{
      ok: boolean
      sessionToken: string
      user: { id: string; email: string }
      team: { id: string; name: string }
      message?: string
    }>('/auth/verify', {
      query: { token },
    })
    
    if (response.ok && response.sessionToken) {
      // Store auth data
      saveToStorage(response.sessionToken, response.user, response.team)
      
      status.value = 'success'
      
      // Redirect to dashboard after a brief moment
      setTimeout(() => {
        navigateTo('/dashboard')
      }, 1500)
    } else {
      throw new Error(response.message || 'Verification failed')
    }
  } catch (e: any) {
    status.value = 'error'
    error.value = e.data?.message || e.message || 'Something went wrong. Please try again.'
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col bg-black antialiased font-mono relative">
    <div class="radial-gradient absolute top-0 md:right-14 right-5"></div>
    <div class="flex-1 flex items-center flex-col justify-center px-6 relative z-10">
      <div class="w-full max-w-sm text-center">
        <NuxtLink to="/" class="font-semibold text-2xl text-white">entrys</NuxtLink>
        
        <div v-if="status === 'loading'" class="mt-8">
          <div class="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
          <p class="text-gray-400 text-sm mt-4">Verifying your link...</p>
        </div>

        <div v-else-if="status === 'success'" class="mt-8">
          <div class="w-12 h-12 bg-green-300/10 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-white text-sm font-medium mt-4">You're in!</p>
          <p class="text-gray-400 text-sm mt-1">Redirecting to dashboard...</p>
        </div>

        <div v-else-if="status === 'error'" class="mt-8">
          <div class="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p class="text-white text-sm font-medium mt-4">Verification failed</p>
          <p class="text-gray-400 text-sm mt-1">{{ error }}</p>
          <div class="mt-6 space-y-3">
            <NuxtLink 
              to="/login" 
              class="block w-full py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try again
            </NuxtLink>
            <NuxtLink 
              to="/" 
              class="block w-full py-2.5 bg-gray-500/10 text-white text-sm font-medium rounded-lg hover:bg-gray-500/20 border border-gray-500/20 transition-colors"
            >
              Back to home
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
