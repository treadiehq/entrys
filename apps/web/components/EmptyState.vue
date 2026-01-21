<script setup lang="ts">
defineProps<{
  icon?: 'tools' | 'agents' | 'logs' | 'activity' | 'alias'
  title: string
  description: string
  actionLabel?: string
}>()

defineEmits<{
  action: []
}>()

const icons = {
  tools: `<circle cx="12" cy="12" r="3" stroke-width="1.5"/>
    <path stroke-width="1.5" d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>`,
  agents: `<rect x="3" y="4" width="18" height="12" rx="2" stroke-width="1.5"/>
    <circle cx="7.5" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="16.5" cy="10" r="1.5" fill="currentColor"/>
    <path stroke-width="1.5" d="M8 20h8M12 16v4"/>`,
  logs: `<path stroke-width="1.5" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline stroke-width="1.5" points="14 2 14 8 20 8"/>
    <line stroke-width="1.5" x1="16" y1="13" x2="8" y2="13"/>
    <line stroke-width="1.5" x1="16" y1="17" x2="8" y2="17"/>
    <polyline stroke-width="1.5" points="10 9 9 9 8 9"/>`,
  activity: `<path stroke-width="1.5" d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
  alias: `<path stroke-width="1.5" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path stroke-width="1.5" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-6">
    <!-- Decorative background -->
    <div class="relative mb-6">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl scale-150"></div>
      <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 flex items-center justify-center shadow-xl">
        <svg 
          class="w-7 h-7 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          v-html="icons[icon || 'activity']"
        />
      </div>
    </div>
    
    <!-- Content -->
    <h3 class="text-lg font-semibold text-white mb-2">{{ title }}</h3>
    <p class="text-sm text-gray-400 text-center max-w-xs mb-6">{{ description }}</p>
    
    <!-- Action button -->
    <button 
      v-if="actionLabel"
      class="btn btn-primary"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
