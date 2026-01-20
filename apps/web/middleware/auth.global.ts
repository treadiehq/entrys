export default defineNuxtRouteMiddleware((to, from) => {
  // Skip auth check on server-side
  if (import.meta.server) return

  // Pages that don't require auth
  const publicPages = ['/', '/login', '/signup', '/verify']
  
  if (publicPages.includes(to.path)) {
    // If user is logged in and trying to access login/signup, redirect to dashboard
    if ((to.path === '/login' || to.path === '/signup') && localStorage.getItem('sessionToken')) {
      return navigateTo('/dashboard')
    }
    return
  }

  // Check for session token
  const sessionToken = localStorage.getItem('sessionToken')
  
  if (!sessionToken) {
    return navigateTo('/login')
  }
})
