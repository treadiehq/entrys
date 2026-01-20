<script setup lang="ts">
const route = useRoute()
const env = useState<'staging' | 'prod'>('currentEnv', () => 'staging')

const navItems = [
  { path: '/', label: 'Overview' },
  { path: '/tools', label: 'Tools' },
  { path: '/agents', label: 'Agents' },
  { path: '/audit', label: 'Audit Log' },
]
</script>

<template>
  <div class="min-h-screen bg-black">
    <!-- Header -->
    <header class="border-b border-gray-500/15 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
        <!-- Logo & Workspace -->
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="w-6 h-6 rounded-lg bg-gray-500/20 border border-gray-500/10 flex items-center justify-center">
            <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </NuxtLink>
          <span class="text-gray-500/50">/</span>
          <span class="font-medium text-sm text-white">entrys</span>
        </div>

        <!-- Navigation -->
        <nav class="flex items-center gap-1 ml-10">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-3 py-1 text-xs rounded-full transition-colors"
            :class="route.path === item.path 
              ? 'bg-gray-500/20 text-white border border-gray-500/10' 
              : 'text-gray-400 hover:text-white hover:bg-gray-500/20 border border-transparent'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <!-- Environment Switcher -->
          <div class="flex items-center rounded-full p-0.5 bg-gray-500/10 border border-gray-500/10">
            <button
              @click="env = 'staging'"
              class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
              :class="env === 'staging' 
                ? 'bg-amber-400/15 text-amber-300 shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="env === 'staging' ? 'bg-amber-400' : 'bg-gray-500/10'"></span>
              Staging
            </button>
            <button
              @click="env = 'prod'"
              class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
              :class="env === 'prod' 
                ? 'bg-green-400/15 text-green-300 shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="env === 'prod' ? 'bg-green-300' : 'bg-gray-500/10'"></span>
              Production
            </button>
          </div>
          
          <!-- User Avatar -->
          <div class="w-7 h-7 rounded-full bg-amber-300/20 border border-amber-300/10 flex items-center justify-center text-xs font-medium text-white">
            D
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>
