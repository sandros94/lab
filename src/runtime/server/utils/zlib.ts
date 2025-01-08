import { gzip, gunzip } from 'node:zlib'
import { toText } from 'undio'
import { destr } from 'destr'
import { defu } from 'defu'

import { useNitroHooks, useRuntimeConfig } from '#imports'
import type { InputType, ZlibOptions } from '#lab/types'

export function useZlib(opts?: ZlibOptions) {
  const runtimeConfig = useRuntimeConfig().lab.zlib
  const defOptions = !runtimeConfig || typeof runtimeConfig === 'boolean'
    ? {}
    : runtimeConfig
  useNitroHooks().callHookSync('lab:zlib:config', defOptions)

  return {
    /**
     * Compresses the given input data using gzip.
     *
     * @param {any} input - The data to be compressed. This can be any type of data, including strings, numbers, objects, etc.
     * @param {ZlibOptions} [options] - Optional configuration options for the compression process.
     * @returns A promise that resolves to the compressed data as a Buffer.
     */
    gzip: (input: any, options: ZlibOptions = {}) => {
      const promise: Promise<Buffer> = new Promise(function (resolve, reject) {
        gzip(JSON.stringify(input), defu(options, opts, defOptions), function (error, result) {
          if (!error) resolve(result)
          else reject(error)
        })
      })
      return promise
    },
    /**
     * Decompresses the given input data using gunzip.
     *
     * @param {InputType} input - The compressed data to be decompressed. This can be a string or ArrayBuffer.
     * @param {ZlibOptions} [options] - Optional configuration options for the decompression process.
     * @returns A promise that resolves to the decompressed data, where T is the type of the original data before compression.
     */
    gunzip: async <T = unknown>(input: InputType, options: ZlibOptions = {}) => {
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
