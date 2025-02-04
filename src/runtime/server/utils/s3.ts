import { destr } from 'destr'

import { useStorage } from '#imports'
import { useZlib } from '#lab/server/utils/zlib'
import type {
  TransactionOptions,
  Storage,
  StorageValue,
  StorageZlib,
  ZlibOptions,
} from '#lab/types'

export function useS3<T extends StorageValue = StorageValue>(base?: string): Storage<T> {
  return useStorage(`lab:s3${base ? `:${base}` : ''}`)
}

export function useS3Zlib<T extends StorageValue = StorageValue>(base?: string, options?: ZlibOptions & { suffix?: string }): StorageZlib<T> {
  const { suffix, ..._options } = options || {}
  const s3 = useS3<T>(base)
  const { gzip, gunzip } = useZlib(_options)

  function s(key: string) {
    return suffix ? `${key}.${suffix}` : `${key}.gz`
  }

  /**
   * Compresses the given input data using gzip and stores it on the FileSystem.
   *
   * @param {string} key - The key to store the compressed data under.
   * @param {any} input - The data to be compressed.
   * @param {TransactionOptions} [opts] - Optional configuration options for the storage operation.
   * @param {ZlibOptions} [zlibOpts] - Optional configuration options for the compression process.
   * @returns A promise that resolves when the operation is complete.
   */
  async function setGzip(
    key: string,
    input: any,
    opts?: TransactionOptions,
    zlibOpts?: ZlibOptions,
  ): Promise<void> {
    if (input === 'undefined') return s3.removeItem(key)
    const data = await gzip(input, zlibOpts)
    return s3.setItemRaw<Buffer>(s(key), data, opts)
  }

  /**
   * Retrieves compressed data from the FileSystem without decompressing it.
   *
   * @param {string} key - The key to retrieve the compressed data from.
   * @param {TransactionOptions} [opts] - Optional configuration options for the storage operation.
   * @returns A promise that resolves to the compressed data, or null if no data is found.
   * @note This method can be directly returned from a Nitro event handler when using `$fetch` or `useFetch`.
   */
  async function getGzip(
    key: string,
    opts?: TransactionOptions,
  ): Promise<Buffer | null> {
    const data = await s3.getItemRaw<Buffer>(s(key), opts)
    if (!data) return null
    return Buffer.from(data)
  }

  /**
   * Retrieves compressed data from the FileSystem, decompresses it, and returns the original data.
   *
   * @param {string} key - The key to retrieve the compressed data from.
   * @param {TransactionOptions} [opts] - Optional configuration options for the storage operation.
   * @param {ZlibOptions} [zlibOpts] - Optional configuration options for the decompression process.
   * @returns A promise that resolves to the decompressed data, or null if no data is found.
   */
  async function getGunzip<T = unknown>(
    key: string,
    opts?: TransactionOptions,
    zlibOpts?: ZlibOptions,
  ): Promise<T | null> {
    const data = await getGzip(key, opts)
    if (data === null) return data
    else if (typeof data === 'string') return destr<T>(data)
    return gunzip<T>(data, zlibOpts)
  }

  return {
    ...s3,
    setGzip,
    getGzip,
    getGunzip,
  }
}
