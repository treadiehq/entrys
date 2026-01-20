<script setup lang="ts">
defineProps<{
  rows?: number
  cols?: number
}>()
</script>

<template>
  <div class="card overflow-hidden">
    <table class="table">
      <thead>
        <tr>
          <th v-for="i in (cols || 5)" :key="i">
            <div class="skeleton h-3 w-16"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in (rows || 5)" :key="row">
          <td v-for="col in (cols || 5)" :key="col">
            <div class="skeleton h-4" :class="col === 1 ? 'w-32' : 'w-20'"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
