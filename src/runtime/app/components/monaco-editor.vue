<script setup lang="ts">
import { useScript } from '@unhead/vue'
// import type * as Monaco from 'monaco-editor'
import { computed, ref, createError, onMounted, watch, useTemplateRef } from '#imports'

const MONACO_CDN_BASE = 'https://unpkg.com/monaco-editor@0.52.2/min/'
const MDC_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@nuxtlabs/monarch-mdc@0.4.0/'

declare global {
  interface Window {
    require: any
    MonacoEnvironment: any
  }
}

// type Editor = ReturnType<typeof Monaco.editor.create>
type Editor = any

const editorEl = useTemplateRef('editorEl')
const code = defineModel<string>({ required: true })
const props = withDefaults(defineProps<{
  fitContent?: boolean
  language?: string
  minimap?: boolean
  readOnly?: boolean
  theme?: string
  wordWrap?: 'on' | 'off'
  tabSize?: number
}>(), {
  language: 'mdc',
  minimap: true,
  readOnly: false,
  theme: 'vs-dark',
  wordWrap: 'on',
  tabSize: 2,
})
let monaco: any // typeof Monaco
let editor: Editor
const editorRef = ref<Editor>()
const styling = computed(() => {
  if (props.fitContent) {
    return {}
  }
  else {
    return { minHeight: '100%' }
  }
})

// Cave's man approach to wait for window.require to be available
const waitForRequire = async (attempt = 1): Promise<void> => {
  if (window.require) return
  if (attempt > 5) throw new Error('Monaco loader.js failed to initialize')

  const delays = [0, 100, 250, 500, 2000]
  await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]))
  return waitForRequire(attempt + 1)
}

const insertTexts = (...texts: string[]) => {
  if (!editor) {
    console.error('Monaco editor is not initialized during text insertion')
    return false
  }
  const selection = editor.getSelection()
  if (!selection) {
    console.error('No selection found during text insertion')
    return false
  }

  return editor.executeEdits(null, texts.map(text => ({
    range: selection,
    text,
    forceMoveMarkers: true,
  })))
}

const { status, load } = useScript({
  src: `${MONACO_CDN_BASE}vs/loader.js`,
}, {
  trigger: 'manual',
  async use() {
    if (editorEl.value) return

    try {
      await waitForRequire()
    }
    catch {
      throw new Error('Failed to load Monaco: loader.js did not initialize')
    }

    window.require.config({
      paths: {
        vs: `${MONACO_CDN_BASE}vs`,
      },
      // 'vs/nls': {
      //   availableLanguages: {},
      // },
    })

    monaco = await new Promise<any>((resolve, reject) => {
      try {
        window.require(['vs/editor/editor.main'], resolve)
      }
      catch (e) {
        reject(new Error('Failed to load Monaco editor: ' + e))
      }
    })

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

    const {
      language: mdc,
      formatter: mdcFormatter,
      foldingProvider: mdcFoldingProvider,
    } = await import(/* @vite-ignore */`${MDC_CDN_BASE}dist/index.mjs`)
    monaco.languages.register({ id: 'mdc' })
    monaco.languages.setMonarchTokensProvider('mdc', mdc)
    monaco.languages.registerDocumentFormattingEditProvider('mdc', {
      provideDocumentFormattingEdits: (model: any) => [{
        range: model.getFullModelRange(),
        text: mdcFormatter(model.getValue(), {
          tabSize: props.tabSize,
        }),
      }],
    })
    monaco.languages.registerOnTypeFormattingEditProvider('mdc', {
      autoFormatTriggerCharacters: ['\n'],
      provideOnTypeFormattingEdits: (model: any) => [{
        range: model.getFullModelRange(),
        text: mdcFormatter(model.getValue(), {
          tabSize: props.tabSize,
          isFormatOnType: true,
        }),
      }],
    })
    monaco.languages.registerFoldingRangeProvider('mdc', {
      provideFoldingRanges: (model: any) => mdcFoldingProvider(model),
    })
    monaco.languages.setLanguageConfiguration('mdc', {
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '\'', close: '\'' },
        { open: '"', close: '"' },
        { open: '`', close: '`' },
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
      ],
    })

    if (!editorEl.value) {
      createError('MonacoEditor must be called in the browser')
      return
    }

    editor = monaco.editor.create(editorEl.value, {
      value: code.value,
      language: props.language,
      tabSize: props.tabSize,
      wordWrap: props.wordWrap,
      wrappingStrategy: 'advanced',
      insertSpaces: true,
      theme: props.theme,
      autoIndent: 'full',
      folding: true,
      detectIndentation: false,
      formatOnType: true,
      formatOnPaste: true,
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

      smoothScrolling: true,
      roundedSelection: false,
      fontSize: 14,
      padding: {
        top: 8,
      },
    })

    editor.onDidChangeModelContent(() => {
      code.value = editor.getValue()
    })
    editorRef.value = editor
  },
})

onMounted(async () => {
  try {
    await load()
  }
  catch (error) {
    console.error('Failed to initialize Monaco:', error)
  }
})

watch(() => props.theme, (newTheme) => {
  if (monaco) {
    monaco.editor.setTheme(newTheme)
  }
})

onBeforeMount(() => {
  if (!editor) return
  editor.dispose()
})

defineExpose({
  editor: editorRef,
  insertTexts,
})
</script>

<template>
  <div v-if="status !== 'loaded'">
    <slot :status="status">
      {{ status }}
    </slot>
  </div>
  <div v-else ref="editorEl" :style="styling" />
</template>
