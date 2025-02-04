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
import type { FSStorageOptions } from 'unstorage/drivers/fs'
import type { S3DriverOptions } from 'unstorage/drivers/s3'
import type { RedisOptions } from 'unstorage/drivers/redis'

import { DEFAULT_KV_OPTIONS } from './runtime/options'
import type { WSConfig, MemoryOptions } from './runtime/types'

export interface ModuleOptions {
  ws?: boolean | WSConfig
  cache?: 'mem' | 'fs' | 's3' | 'kv' | null
  mem?: MemoryOptions
  fs?: FSStorageOptions
  s3?: boolean | S3DriverOptions
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
    cache: null,
    s3: false,
    kv: false,
    zlib: false,
    valibot: false,
    monacoEditor: false,
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.alias['#lab'] = resolve('./runtime')

    const labConfig = nuxt.options.runtimeConfig.lab ||= {}
    const labPublicConfig = nuxt.options.runtimeConfig.public.lab ||= {}
    labConfig.cache ||= options.cache
    labConfig.mem = defu<MemoryOptions, [MemoryOptions]>(
      labConfig.mem,
      options.mem || {},
    )
    labConfig.fs = defu<FSStorageOptions, [FSStorageOptions | undefined, FSStorageOptions]>(
      labConfig.fs,
      options.fs,
      {
        base: '.data/lab',
        ignore: ['**/node_modules/**', '**/.git/**'],
      },
    )
    labConfig.s3 = defu<S3DriverOptions, [S3DriverOptions]>(
      labConfig.s3,
      options.s3 && typeof options.s3 !== 'boolean'
        ? options.s3
        : {
            endpoint: '',
            region: '',
            bucket: '',
            accessKeyId: '',
            secretAccessKey: '',
          },
    )
    labConfig.kv = defu<RedisOptions, RedisOptions[]>(
      labConfig.kv,
      options.kv && typeof options.kv !== 'boolean' ? options.kv : {},
      DEFAULT_KV_OPTIONS,
    )
    labConfig.zlib = defu<ZlibOptions, [ZlibOptions]>(
      labConfig.zlib,
      options.zlib && typeof options.zlib !== 'boolean' ? options.zlib : {},
    )
    labPublicConfig.ws = defu<WSConfig, [WSConfig, WSConfig]>(
      labPublicConfig.ws,
      options.ws && typeof options.ws !== 'boolean' ? options.ws : {},
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
      options.zlib !== false
        ? {
            as: 'useMem',
            name: 'useMemZlib',
            from: resolve('./runtime/server/utils/mem'),
          }
        : {
            as: 'useMem',
            name: 'useMem',
            from: resolve('./runtime/server/utils/mem'),
          },
      options.zlib !== false
        ? {
            as: 'useFS',
            name: 'useFSZlib',
            from: resolve('./runtime/server/utils/fs'),
          }
        : {
            as: 'useFS',
            name: 'useFS',
            from: resolve('./runtime/server/utils/fs'),
          },
    ]
    addServerPlugin(resolve('./runtime/server/plugins/mem'))
    addServerPlugin(resolve('./runtime/server/plugins/fs'))

    // Start check for enabled utils
    if (options.zlib !== false)
      serverImports.push({
        name: 'useZlib',
        from: resolve('./runtime/server/utils/zlib'),
      })

    if (options.s3 !== false) {
      addServerPlugin(resolve('./runtime/server/plugins/s3'))
      if (options.zlib !== false) serverImports.push({ name: 'useS3Zlib', as: 'useS3', from: resolve('./runtime/server/utils/s3') })
      else serverImports.push({ name: 'useS3', as: 'useS3', from: resolve('./runtime/server/utils/s3') })
    }

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

      appImports.push({
        name: 'useWSState',
        from: resolve('./runtime/app/composables/ws'),
      })
      appImports.push({
        name: 'useWS',
        from: resolve('./runtime/app/composables/ws'),
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
      cache?: 'mem' | 'fs' | 's3' | 'kv' | null
      mem?: MemoryOptions
      fs?: FSStorageOptions
      s3?: S3DriverOptions
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
    'lab:mem:config': (options: RedisOptions) => void
    'lab:fs:config': (options: FSStorageOptions) => void
    'lab:s3:config': (options: S3DriverOptions) => void
    'lab:kv:config': (options: RedisOptions) => void
    'lab:zlib:config': (options: ZlibOptions) => void
  }
}
