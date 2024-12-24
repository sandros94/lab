import type { ZlibOptions } from 'node:zlib'
import {
  defineNuxtModule,
  addComponent,
  addServerPlugin,
  addServerImports,
  createResolver,
  installModule,
} from '@nuxt/kit'
import type { RedisOptions } from 'unstorage/drivers/redis'
import type { Import } from 'unimport'
import { ensureDependencyInstalled } from 'nypm'
import { defu } from 'defu'
import {
  DEFAULT_KV_OPTIONS,
} from './runtime/kv'

// Module options TypeScript interface definition
export interface ModuleOptions {
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
    kv: false,
    zlib: false,
    valibot: true,
    monacoEditor: false,
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const labConfig = nuxt.options.runtimeConfig.lab ||= {}
    labConfig.kv = defu(
      labConfig.kv,
      typeof options.kv === 'boolean' ? {} : options.kv,
      DEFAULT_KV_OPTIONS,
    )
    labConfig.zlib = defu(
      labConfig.zlib,
      typeof options.zlib === 'boolean' ? {} : options.zlib,
    )

    const serverImports: Import[] = [
      {
        name: 'useNitroHooks',
        from: resolve('./runtime/server/utils/hooks'),
      },
    ]

    // Start check for enabled utils
    if (labConfig.zlib)
      serverImports.push({
        name: 'useZlib',
        from: resolve('./runtime/server/utils/zlib'),
      })

    if (labConfig.kv) {
      addServerPlugin(resolve('./runtime/server/plugins/kv'))
      if (labConfig.zlib) serverImports.push({ name: 'useKVZlib', as: 'useKV', from: resolve('./runtime/server/utils/kv') })
      else serverImports.push({ name: 'useKV', as: 'useKV', from: resolve('./runtime/server/utils/kv') })
    }

    if (options.valibot) {
      await ensureDependencyInstalled('h3-valibot')
        .then(async () => { await installModule('h3-valibot/nuxt') })
    }

    if (options.monacoEditor) {
      addComponent({
        name: 'MonacoEditor',
        filePath: resolve('./runtime/app/components/monaco-editor'),
      })
    }
    // End check for enabled utils

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
}

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'lab:kv:config': (options: RedisOptions) => void
    'lab:zlib:config': (options: ZlibOptions) => void
  }
}
