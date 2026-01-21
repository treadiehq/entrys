import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // Prevent caching in development
  routeRules: {
    '/': {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    },
  },
  
  app: {
    head: {
      htmlAttrs: {
        style: 'background-color: #000000',
      },
      bodyAttrs: {
        style: 'background-color: #000000',
      },
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        {
          rel: 'preconnect',
          href: 'https://geistfont.vercel.app',
        },
        {
          rel: 'stylesheet',
          href: 'https://geistfont.vercel.app/geist.css',
        },
      ],
    },
  },
  
  css: ['~/assets/css/main.css'],
  
  vite: {
    plugins: [tailwindcss()],
  },
  
  runtimeConfig: {
    apiUrl: process.env.NUXT_API_URL || 'http://localhost:3001',
    adminKey: process.env.NUXT_ADMIN_KEY || 'admin_dev_secret_key_change_in_prod',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001',
    },
  },
  
  typescript: {
    strict: true,
  },
  
  compatibilityDate: '2024-01-01',
})
