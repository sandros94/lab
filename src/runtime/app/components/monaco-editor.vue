<script setup lang="ts">
import { computed, ref, useTemplateRef, useScriptNpm } from '#imports'

const MONACO_CDN_BASE = 'https://unpkg.com/monaco-editor@0.52.0/min/'

const editorEl = useTemplateRef('editor')
const code = defineModel<string>({ required: true })
const props = withDefaults(defineProps<{
  fitContent?: boolean
  language?: string
  minimap?: boolean
  readOnly?: boolean
  theme?: string
  wordWrap?: 'on' | 'off'
}>(), {
  language: 'mdc',
  minimap: true,
  readOnly: false,
  theme: 'vs-dark',
  wordWrap: 'on',
})
const monaco = ref()
const editor = ref()
const styling = computed(() => {
  if (props.fitContent) {
    return {}
  }
  else {
    return { height: '100%' }
  }
})

// @ts-expect-error ts causing issues with nuxt imports
const { status, load } = useScriptNpm({
  packageName: 'monaco-editor',
  file: 'min/vs/loader.js',
  version: '0.52.0',
  scriptOptions: {
    trigger: 'manual',
    async use() {
      // @ts-expect-error: in-browser event
      window.require.config({ paths: { vs: `${MONACO_CDN_BASE}vs` } })
      // @ts-expect-error: in-browser event
      const monaco = await new Promise<any>(resolve => window.require(['vs/editor/editor.main'], resolve))

      // @ts-expect-error: in-browser event
      window.MonacoEnvironment = {
        getWorkerUrl: function () {
          return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
  self.MonacoEnvironment = {
    baseUrl: '${MONACO_CDN_BASE}'
  };
  importScripts('${MONACO_CDN_BASE}vs/base/worker/workerMain.js');`,
          )}`
        },
      }

      // @ts-expect-error: in-browser event
      const { language: monarchMdc } = await import('https://cdn.jsdelivr.net/npm/@nuxtlabs/monarch-mdc@0.2.0/dist/index.mjs')
      monaco.languages.register({ id: 'mdc' })
      monaco.languages.setMonarchTokensProvider('mdc', monarchMdc)
      monaco.languages.setLanguageConfiguration('mdc', {
        surroundingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '<', close: '>' },
          { open: '\'', close: '\'' },
          { open: '"', close: '"' },
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '\'', close: '\'' },
          { open: '"', close: '"' },
        ],
      })

      if (!editorEl.value) {
        createError('MonacoEditor must be called in the browser')
        return
      }
      const editor = monaco.editor.create(editorEl.value, {
        value: code.value,
        language: props.language,
        tabSize: 2,
        wordWrap: props.wordWrap,
        wrappingStrategy: 'advanced',
        insertSpaces: true,
        theme: props.theme,
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        automaticLayout: true,
        readOnly: props.readOnly,
        minimap: {
          enabled: props.minimap,
        },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        bracketPairColorization: {
          enabled: true,
        },

        roundedSelection: false,
        fontSize: 14,
        padding: {
          top: 8,
        },
      })

      editor.onDidChangeModelContent(() => {
        code.value = editor.getValue()
      })

      const updateHeight = () => {
        if (!props.fitContent) return
        const contentHeight = editor.getContentHeight()
        editorEl.value!.style.height = `${contentHeight}px`
        editor.layout({
          width: editorEl.value!.offsetWidth,
          height: Math.min(contentHeight, editorEl.value!.offsetHeight),
        })
      }

      editor.onDidContentSizeChange(updateHeight)

      return {
        editor,
        monaco,
      }
    },
  },
})

onMounted(async () => {
  const {
    editor: ed,
    monaco: mo,
  } = await load()
  monaco.value = mo
  editor.value = ed
})

// watch(code, (newCode) => {
//   if (editor.value && editor.value.getValue() !== newCode) {
//     editor.value.setValue(newCode)
//   }
// })

watch(() => props.theme, (newTheme) => {
  if (monaco.value) {
    monaco.value.editor.setTheme(newTheme)
  }
})
</script>

<template>
  <div v-if="status !== 'loaded'">
    <slot :status="status">
      {{ status }}
    </slot>
  </div>
  <div v-else ref="editor" :style="styling" />
</template>
