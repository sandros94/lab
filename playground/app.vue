<template>
  <div style="height: calc(100svh - 16px);">
    <MonacoEditor v-model="code" fit-content />
  </div>
</template>

<script setup lang="ts">
const code = ref('# ciao')
</script>
