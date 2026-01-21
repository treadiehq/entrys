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
      title: 'Entrys - The entry point for agent tool calls',
      htmlAttrs: {
        style: 'background-color: #000000',
      },
      bodyAttrs: {
        style: 'background-color: #000000',
      },
      meta: [
        { name: 'description', content: 'Give your AI agents a single entry point to access internal APIs, MCP servers and services.' },
        { property: 'og:title', content: 'Entrys - The entry point for agent tool calls' },
        { property: 'og:description', content: 'Give your AI agents a single entry point to access internal APIs, MCP servers and services.' },
        { property: 'og:image', content: 'https://entrys.co/entrys.png' },
        { property: 'og:url', content: 'https://entrys.co' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Entrys - The entry point for agent tool calls' },
        { name: 'twitter:description', content: 'Give your AI agents a single entry point to access internal APIs, MCP servers and services.' },
        { name: 'twitter:image', content: 'https://entrys.co/entrys.png' },
      ],
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
      script: [
        {
          src: 'https://cdn.seline.com/seline.js',
          async: true,
          'data-token': '7daf7b1cd11f5a7',
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
