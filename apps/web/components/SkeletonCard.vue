<script setup lang="ts">
defineProps<{
  lines?: number
}>()
</script>

<template>
  <div class="card p-5">
    <div class="flex items-center gap-3 mb-4">
      <div class="skeleton w-10 h-10 rounded-lg"></div>
      <div class="space-y-2">
        <div class="skeleton h-6 w-12"></div>
        <div class="skeleton h-3 w-16"></div>
      </div>
    </div>
    <div class="skeleton h-4 w-24"></div>
  </div>
</template>
