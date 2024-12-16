import type { ZlibOptions } from 'node:zlib'
import {
  defineNuxtModule,
  addServerPlugin,
  addServerImports,
  createResolver,
  installModule,
} from '@nuxt/kit'
import type redisDriver from 'unstorage/drivers/redis'
import type { Import } from 'unimport'
import { defu } from 'defu'

// Module options TypeScript interface definition
export interface ModuleOptions {
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
    kv: false,
    zlib: false,
    valibot: true,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const labConfig = nuxt.options.runtimeConfig.lab ||= {}
    labConfig.kv = defu(
      labConfig.kv,
      options.kv,
      {
        name: 'kv',
      },
    )
    labConfig.zlib = defu(
      labConfig.zlib,
      options.zlib,
    )

    const serverImports: Import[] = [
      {
        name: 'useNitroHooks',
        from: resolve('./runtime/server/utils/hooks'),
      },
    ]

    // Check for enabled utils
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

    if (options.valibot)
      installModule('h3-valibot/nuxt')
      // nuxt.options.modules.push('h3-valibot/nuxt')
    // End enabled utils check

    addServerImports(serverImports)
  },
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    lab: ModuleOptions
  }
}

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'lab:zlib:config': (options: ZlibOptions) => void
  }
}
