<template>
  <div>
    <MDCRenderer
      v-if="data?.type === 'markdown' && data.content"
      :body="data.content.body"
      :data="data.content.data"
    />
    <div v-else-if="data">
      <code>
        Format: {{ data.type }}
      </code>
      <pre :language="data.type">
        {{ data.content }}
      </pre>
    </div>
    <div v-if="error">
      <h2>{{ error.statusCode }}</h2>
      <p>
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { joinURL } from 'ufo'
import type { StaticContent } from '#lab/cms'

const { params } = useRoute('slug')
const { data, error } = await useFetch<StaticContent>(joinURL('/_cms', ...(params.slug || ['index'])), {
  watch: [() => params.slug],
})
</script>
