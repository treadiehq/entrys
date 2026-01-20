<script setup lang="ts">
const props = defineProps<{
  date: string | Date
}>()

const { formatTimeAgo, formatFullDate } = useTimeAgo()

// Update every minute
const timeAgo = ref(formatTimeAgo(props.date))
const fullDate = computed(() => formatFullDate(props.date))

let interval: ReturnType<typeof setInterval>

onMounted(() => {
  interval = setInterval(() => {
    timeAgo.value = formatTimeAgo(props.date)
  }, 60000)
})

onUnmounted(() => {
  clearInterval(interval)
})

watch(() => props.date, (newDate) => {
  timeAgo.value = formatTimeAgo(newDate)
})
</script>

<template>
  <span :title="fullDate" class="cursor-help">
    {{ timeAgo }}
  </span>
</template>
