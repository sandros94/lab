<script setup lang="ts">
import { useScript } from '@unhead/vue'
import { computed, ref, createError, onMounted, watch, useTemplateRef } from '#imports'

const MONACO_CDN_BASE = 'https://unpkg.com/monaco-editor@0.52.0/min/'
const MDC_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@nuxtlabs/monarch-mdc@0.4.0/'

declare global {
  interface Window {
    require: any
    MonacoEnvironment: any
  }
}

const editorEl = useTemplateRef('editor')
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

// Cave's man approach to wait for window.require to be available
const waitForRequire = async (attempt = 1): Promise<void> => {
  if (window.require) return
  if (attempt > 5) throw new Error('Monaco loader.js failed to initialize')

  const delays = [0, 100, 250, 500, 2000]
  await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]))
  return waitForRequire(attempt + 1)
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

    const _monaco = await new Promise<any>((resolve, reject) => {
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
    _monaco.languages.register({ id: 'mdc' })
    _monaco.languages.setMonarchTokensProvider('mdc', mdc)
    _monaco.languages.registerDocumentFormattingEditProvider('mdc', {
      provideDocumentFormattingEdits: (model: any) => [{
        range: model.getFullModelRange(),
        text: mdcFormatter(model.getValue(), {
          tabSize: props.tabSize,
        }),
      }],
    })
    _monaco.languages.registerOnTypeFormattingEditProvider('mdc', {
      autoFormatTriggerCharacters: ['\n'],
      provideOnTypeFormattingEdits: (model: any) => [{
        range: model.getFullModelRange(),
        text: mdcFormatter(model.getValue(), {
          tabSize: props.tabSize,
          isFormatOnType: true,
        }),
      }],
    })
    _monaco.languages.registerFoldingRangeProvider('mdc', {
      provideFoldingRanges: (model: any) => mdcFoldingProvider(model),
    })
    _monaco.languages.setLanguageConfiguration('mdc', {
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

    const _editor = _monaco.editor.create(editorEl.value, {
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

      roundedSelection: false,
      fontSize: 14,
      padding: {
        top: 8,
      },
    })

    _editor.onDidChangeModelContent(() => {
      code.value = _editor.getValue()
    })

    const updateHeight = () => {
      if (!props.fitContent) return
      const contentHeight = _editor.getContentHeight()
      editorEl.value!.style.height = `${contentHeight}px`
      _editor.layout({
        width: editorEl.value!.offsetWidth,
        height: Math.min(contentHeight, editorEl.value!.offsetHeight),
      })
    }

    _editor.onDidContentSizeChange(updateHeight)

    return {
      editor: _editor,
      monaco: _monaco,
    }
  },
})

onMounted(async () => {
  try {
    const l = await load()
    if (!l) return

    monaco.value = l.monaco
    editor.value = l.editor
  }
  catch (error) {
    console.error('Failed to initialize Monaco:', error)
  }
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
