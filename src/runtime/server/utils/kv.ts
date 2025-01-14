import { uint8ArrayToBase64 } from 'undio'
import { destr } from 'destr'

import { useStorage } from '#imports'
import { useZlib } from '#lab/server/utils/zlib'
import type {
  MaybeDefined,
  TransactionOptions,
  Storage,
  StorageValue,
  StorageZlib,
  ZlibOptions,
} from '#lab/types'

export function useKV<T extends StorageValue = StorageValue>(base?: string): Storage<T> {
  return useStorage(base ? `CACHE:${base}` : 'CACHE')
}

export function useKVZlib<T extends StorageValue = StorageValue>(base?: string, options?: ZlibOptions): StorageZlib<T> {
  const kv = useStorage<T>(base ? `CACHE:${base}` : 'CACHE')
  const { gzip, gunzip } = useZlib(options)

  /**
   * Compresses the given input data using gzip and stores it in the KV store.
   *
   * @param {string} key - The key to store the compressed data under.
   * @param {any} input - The data to be compressed.
   * @param {TransactionOptions} [kvOpts] - Optional configuration options for the storage operation.
   * @param {ZlibOptions} [zlibOpts] - Optional configuration options for the compression process.
   * @returns A promise that resolves when the operation is complete.
   */
  async function setGzip(
    key: string,
    input: undefined,
    kvOpts?: (TransactionOptions & {
      removeMeta?: boolean
    }) | boolean,
    zlibOpts?: ZlibOptions,
  ): Promise<void>
  async function setGzip(
    key: string,
    input: any,
    kvOpts?: TransactionOptions,
    zlibOpts?: ZlibOptions,
  ): Promise<void>
  async function setGzip(
    key: string,
    input: any,
    kvOpts?: any,
    zlibOpts?: any,
  ): Promise<void> {
    if (input === 'undefined') return kv.removeItem(key)
    const data = await gzip(input, zlibOpts)
    return kv.setItemRaw<string>(key, serializeRaw(data), kvOpts)
  }

  /**
   * Retrieves compressed data from the KV store without decompressing it.
   *
   * @param {string} key - The key to retrieve the compressed data from.
   * @param {TransactionOptions} [opts] - Optional configuration options for the storage operation.
   * @returns A promise that resolves to the compressed data, or null if no data is found.
   * @note This method can be directly returned from a Nitro event handler when using `$fetch` or `useFetch`.
   */
  async function getGzip<T extends (Buffer | string)>(
    key: string,
    opts?: TransactionOptions,
  ): Promise<MaybeDefined<T> | null> {
    return kv.getItemRaw<T>(key, opts)
  }

  /**
   * Retrieves compressed data from the KV store, decompresses it, and returns the original data.
   *
   * @param {string} key - The key to retrieve the compressed data from.
   * @param {TransactionOptions} [kvOpts] - Optional configuration options for the storage operation.
   * @param {ZlibOptions} [zlibOpts] - Optional configuration options for the decompression process.
   * @returns A promise that resolves to the decompressed data, or null if no data is found.
   */
  async function getGunzip<T = unknown>(
    key: string,
    kvOpts?: TransactionOptions,
    zlibOpts?: ZlibOptions,
  ): Promise<T | null> {
    const data = await getGzip(key, kvOpts)
    if (data === null) return data
    else if (typeof data === 'string') return destr<T>(data)
    const test = await gunzip<T>(data, zlibOpts)
    return test
  }

  return {
    ...kv,
    setGzip,
    getGzip,
    getGunzip,
  }
}

/**
 * From `unjs/unstorage` implementation
 * https://github.com/unjs/unstorage/blob/6163be0eb5035b54f3a576086e7b41a48efa3607/src/_utils.ts
 */
const BASE64_PREFIX = 'base64:'

function serializeRaw(value: any) {
  if (typeof value === 'string') {
    return value
  }
  const base64 = uint8ArrayToBase64(value, { dataURL: false })
  return BASE64_PREFIX + base64
}
