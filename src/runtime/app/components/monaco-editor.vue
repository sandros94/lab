<script setup lang="ts">
import { useScript } from '@unhead/vue'
import { computed, ref, createError, onMounted, watch, useTemplateRef } from '#imports'

const MONACO_CDN_BASE = 'https://unpkg.com/monaco-editor@0.52.0/min/'
const MDC_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@nuxtlabs/monarch-mdc@0.4.0/'

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

const { status, load } = useScript({
  src: `${MONACO_CDN_BASE}vs/loader.js`,
}, {
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

    const {
      language: mdc,
      formatter: mdcFormatter,
      foldingProvider: mdcFoldingProvider,
    } = await import(`${MDC_CDN_BASE}dist/index.mjs`)
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
    const editor = monaco.editor.create(editorEl.value, {
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
})

onMounted(async () => {
  const {
    editor: ed,
    monaco: mo,
  } = await load() || {}
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
