import type { InputType, ZlibOptions } from 'node:zlib'
import { gzip, gunzip } from 'node:zlib'
import { toText } from 'undio'
import { destr } from 'destr'
import { defu } from 'defu'

import { useNitroHooks } from './hooks'
import { useRuntimeConfig } from '#imports'

export type { ZlibOptions }

export function useZlib(opts?: ZlibOptions) {
  const runtimeConfig = useRuntimeConfig().lab.zlib
  const defOptions = !runtimeConfig || typeof runtimeConfig === 'boolean'
    ? {}
    : runtimeConfig
  useNitroHooks().hookSync('lab:zlib:config', defOptions)

  return {
    gzip: (input: any, options: ZlibOptions = {}) => {
      const promise: Promise<Buffer> = new Promise(function (resolve, reject) {
        gzip(JSON.stringify(input), defu(options, opts, defOptions), function (error, result) {
          if (!error) resolve(result)
          else reject(error)
        })
      })
      return promise
    },
    gunzip: async <T>(input: InputType, options: ZlibOptions = {}) => {
      const promise: Promise<Buffer> = new Promise(function (resolve, reject) {
        gunzip(input, defu(options, opts, defOptions), function (error, result) {
          if (!error) resolve(result)
          else reject(error)
        })
      })
      return destr<T>(toText(await promise))
    },
  }
}
