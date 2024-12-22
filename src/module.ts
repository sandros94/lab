import type { ZlibOptions } from 'node:zlib'
import {
  defineNuxtModule,
  addComponent,
  addServerPlugin,
  addServerImports,
  createResolver,
  installModule,
} from '@nuxt/kit'
import type redisDriver from 'unstorage/drivers/redis'
import type { Import } from 'unimport'
import { ensureDependencyInstalled } from 'nypm'
import { defu } from 'defu'

// Module options TypeScript interface definition
export interface ModuleOptions {
  monacoEditor?: boolean
  kv?: boolean | Parameters<typeof redisDriver>[0]
  zlib?: boolean | ZlibOptions
  valibot?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@sandros94/lab',
    configKey: 'lab',
  },
  defaults: {
    monacoEditor: false,
    kv: false,
    zlib: false,
    valibot: true,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const labConfig = nuxt.options.runtimeConfig.lab ||= {}
    labConfig.kv = defu(
      typeof labConfig.kv === 'boolean' ? {} : labConfig.kv,
      typeof options.kv === 'boolean' ? {} : options.kv,
      {
        name: 'kv',
      },
    )
    labConfig.zlib = defu(
      typeof labConfig.zlib === 'boolean' ? {} : labConfig.zlib,
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
      ensureDependencyInstalled('h3-valibot')
      installModule('h3-valibot/nuxt')
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
    lab: Pick<ModuleOptions, 'kv' | 'zlib'>
  }
}

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'lab:zlib:config': (options: ZlibOptions) => void
  }
}
