<template>
  <div ref="area" style="height: calc(100svh - 16px);">
    <MonacoEditor ref="editor" v-model="code" />
  </div>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core'

const code = ref('# ciao')

const area = useTemplateRef('area')
const monaco = useTemplateRef('editor')

useDropZone(area, {
  onDrop,
  multiple: true,
})

function onDrop(files: File[] | null) {
  console.log('files', files)
  if (files?.length) {
    files.forEach((file) => {
      monaco.value?.insertTexts(`![${file.name}](${URL.createObjectURL(file)})`)
    })
  }
}
</script>
