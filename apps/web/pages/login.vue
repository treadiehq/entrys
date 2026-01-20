<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

useHead({
  title: 'Login - Entrys'
})

const { fetchApi } = useApi()

const email = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref(false)

async function handleLogin() {
  isLoading.value = true
  error.value = ''
  success.value = false
  
  try {
    await fetchApi('/auth/login', {
      method: 'POST',
      body: { email: email.value },
    })
    success.value = true
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col bg-black antialiased font-mono relative">
    <div class="radial-gradient absolute top-0 md:right-14 right-5"></div>
    <div class="flex-1 flex items-center flex-col justify-center px-6 relative z-10">
      <div class="w-full max-w-sm">
        <div class="mb-8">
          <NuxtLink to="/" class="font-semibold text-2xl text-white">entrys</NuxtLink>
          <p class="text-gray-400 text-sm mt-2">Sign in to your account</p>
        </div>

        <div v-if="success" class="space-y-4">
          <div class="p-4 bg-green-300/10 border border-green-500/10 rounded-lg">
            <p class="text-green-300 text-sm font-medium">Check your email</p>
            <p class="text-gray-400 text-sm mt-1">We've sent a magic link to <span class="text-white">{{ email }}</span></p>
          </div>
          <button
            @click="success = false; email = ''"
            class="w-full py-2.5 bg-gray-500/10 text-white text-sm font-medium rounded-lg hover:bg-gray-500/20 border border-gray-500/20 transition-colors"
          >
            Use a different email
          </button>
        </div>

        <form v-else @submit.prevent="handleLogin" class="space-y-4">
          <div v-if="error" class="p-3 bg-red-400/10 border border-red-400/10 rounded-lg text-red-400 text-sm">
            {{ error }}
          </div>

          <div>
            <label for="email" class="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full px-4 py-2.5 bg-gray-500/10 border border-gray-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-gray-500/40 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Sending...' : 'Send magic link' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-400">
          Don't have an account?
          <NuxtLink to="/signup" class="text-white hover:underline">Sign up</NuxtLink>
        </p>
      </div>
    </div>

    <footer class="">
      <div class="max-w-sm mx-auto px-4">
        <div class="flex items-center justify-center py-6">
          <p class="text-xs text-gray-500">
            &copy; {{ new Date().getFullYear() }} Treadie, Inc.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
