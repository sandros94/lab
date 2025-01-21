import type { ZlibOptions } from 'node:zlib'
import {
  defineNuxtModule,
  addComponent,
  addImports,
  addServerPlugin,
  addServerImports,
  createResolver,
  installModule,
} from '@nuxt/kit'
import { defu } from 'defu'
import type { Import } from 'unimport'
import { ensureDependencyInstalled } from 'nypm'
import type { RedisOptions } from 'unstorage/drivers/redis'

import { DEFAULT_KV_OPTIONS } from './runtime/options'
import type { WSConfig } from './runtime/types'

export interface ModuleOptions {
  ws?: boolean | WSConfig
  kv?: boolean | RedisOptions
  zlib?: boolean | ZlibOptions
  valibot?: boolean
  monacoEditor?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@sandros94/lab',
    configKey: 'lab',
  },
  defaults: {
    ws: false,
    kv: false,
    zlib: false,
    valibot: true,
    monacoEditor: false,
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.alias['#lab'] = resolve('./runtime')

    const labConfig = nuxt.options.runtimeConfig.lab ||= {}
    const labPublicConfig = nuxt.options.runtimeConfig.public.lab ||= {}
    labConfig.kv = defu(
      labConfig.kv,
      typeof options.kv === 'boolean' ? {} : options.kv,
      DEFAULT_KV_OPTIONS,
    )
    labConfig.zlib = defu(
      labConfig.zlib,
      typeof options.zlib === 'boolean' ? {} : options.zlib,
    )
    labPublicConfig.ws = defu(
      labPublicConfig.ws,
      typeof options.ws === 'boolean' ? {} : options.ws,
      {
        channels: {
          defaults: [],
          internal: [],
        },
      },
    )

    const appImports: Import[] = [
      {
        name: 'useMultiState',
        from: resolve('./runtime/app/composables/multi-state'),
      },
    ]
    const serverImports: Import[] = [
      {
        name: 'useNitroHooks',
        from: resolve('./runtime/server/utils/hooks'),
      },
    ]

    // Start check for enabled utils
    if (options.zlib !== false)
      serverImports.push({
        name: 'useZlib',
        from: resolve('./runtime/server/utils/zlib'),
      })

    if (options.kv !== false) {
      addServerPlugin(resolve('./runtime/server/plugins/kv'))
      if (options.zlib !== false) serverImports.push({ name: 'useKVZlib', as: 'useKV', from: resolve('./runtime/server/utils/kv') })
      else serverImports.push({ name: 'useKV', as: 'useKV', from: resolve('./runtime/server/utils/kv') })
    }

    if (options.valibot !== false) {
      await ensureDependencyInstalled('h3-valibot')
        .then(async () => { await installModule('h3-valibot/nuxt') })
    }

    if (options.monacoEditor !== false) {
      addComponent({
        name: 'MonacoEditor',
        filePath: resolve('./runtime/app/components/monaco-editor'),
      })
    }

    if (options.ws !== false) {
      (nuxt.options.nitro.experimental ||= {}).websocket = true

      await ensureDependencyInstalled('@vueuse/core')
        .then(() => {
          appImports.push({
            name: 'useWSState',
            from: resolve('./runtime/app/composables/ws'),
          })
          appImports.push({
            name: 'useWS',
            from: resolve('./runtime/app/composables/ws'),
          })
        })

      serverImports.push({
        name: 'wsHooks',
        from: resolve('./runtime/server/utils/ws'),
      })
      serverImports.push({
        name: 'wsBroadcast',
        from: resolve('./runtime/server/utils/ws'),
      })
      serverImports.push({
        name: 'getWSChannels',
        from: resolve('./runtime/server/utils/ws'),
      })
      serverImports.push({
        name: 'defineReactiveWSHandler',
        from: resolve('./runtime/server/utils/ws'),
      })
      // TODO: remove on next major
      serverImports.push({
        name: 'useWebSocketHandler',
        from: resolve('./runtime/server/utils/ws'),
      })
    }
    // End check for enabled utils

    addImports(appImports)
    addServerImports(serverImports)
  },
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    lab: {
      kv?: RedisOptions
      zlib?: ZlibOptions
    }
  }
  interface PublicRuntimeConfig {
    lab: {
      ws?: WSConfig
    }
  }
}

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'lab:kv:config': (options: RedisOptions) => void
    'lab:zlib:config': (options: ZlibOptions) => void
  }
}
