<script lang="ts">
import { defu } from 'defu'
import { useScript } from '@unhead/vue'
import type * as _Monaco from 'monaco-editor'
import { computed, ref, createError, onMounted, onBeforeUnmount, watch, useTemplateRef } from '#imports'

export type Monaco = typeof _Monaco
export type MonacoEditor = _Monaco.editor.IStandaloneCodeEditor
export type MonacoEditorOptions = _Monaco.editor.IStandaloneEditorConstructionOptions
export type MonacoEditorOverrides = _Monaco.editor.IEditorOverrideServices
export type MonacoTextModel = _Monaco.editor.ITextModel
export type MonacoUri = _Monaco.Uri

declare global {
  interface Window {
    require: any
  }
}

export interface MonacoEditorProps {
  fitContent?: boolean
  language?: string
  options?: MonacoEditorOptions
  overrides?: MonacoEditorOverrides
  model?: MonacoTextModel
  theme?: MonacoEditorOptions['theme']
  modelUri?: MonacoUri
  versions?: {
    monaco: string
    mdc: string
  }
}
export interface MonacoEmits {
  (event: 'editor:ready', editor: MonacoEditor): void
}
</script>

<script setup lang="ts">
const editorEl = useTemplateRef('editorEl')
const code = defineModel<string>({ required: true })
const props = defineProps<MonacoEditorProps>()
const emits = defineEmits<MonacoEmits>()
let monaco: Monaco
let editor: MonacoEditor
let _model: MonacoTextModel
const editorRef = ref<MonacoEditor>()

const MONACO_CDN_BASE = `https://unpkg.com/monaco-editor@${props.versions?.monaco || '0.52.2'}/min/`
const MDC_CDN_BASE = `https://cdn.jsdelivr.net/npm/@nuxtlabs/monarch-mdc@${props.versions?.mdc || '0.5.0'}/`

const editorOptions = computed(() => defu<MonacoEditorOptions, [MonacoEditorOptions]>(props.options, {
  value: code.value,
  language: props.language || 'mdc',
  tabSize: 2,
  wordWrap: 'on',
  wrappingStrategy: 'advanced',
  insertSpaces: true,
  theme: props.theme || 'vs-dark',
  autoIndent: 'full',
  folding: true,
  detectIndentation: false,
  formatOnType: true,
  formatOnPaste: true,
  automaticLayout: true,
  readOnly: false,
  minimap: {
    enabled: true,
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
}))
const _theme = computed(() => editorOptions.value.theme)
const _language = computed(() => editorOptions.value.language)
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

const insertTexts = (...texts: string[]): boolean => {
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
          tabSize: editorOptions.value.tabSize,
        }),
      }],
    })
    monaco.languages.registerOnTypeFormattingEditProvider('mdc', {
      autoFormatTriggerCharacters: ['\n'],
      provideOnTypeFormattingEdits: (model: any) => [{
        range: model.getFullModelRange(),
        text: mdcFormatter(model.getValue(), {
          tabSize: editorOptions.value,
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

    editor = monaco.editor.create(editorEl.value, editorOptions.value, props.overrides)

    editor.onDidChangeModelContent(() => {
      code.value = editor.getValue()
    })
    editorRef.value = editor

    emits('editor:ready', editor)
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

watch(() => [_language, props.modelUri], () => {
  if (_model) {
    _model.dispose()
  }
  if (monaco && editor) {
    _model = monaco.editor.createModel(code.value, _language.value, props.modelUri)
    editor.setModel(_model)
  }
})
watch(_theme, (newTheme) => {
  if (monaco) {
    monaco.editor.setTheme(newTheme!)
  }
})
watch(editorOptions, (newOptions) => {
  if (editor)
    editor.updateOptions(newOptions)
})

onBeforeUnmount(() => {
  if (editor)
    editor.dispose()
  if (_model)
    _model.dispose()
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
