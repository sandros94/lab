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

export function useFS<T extends StorageValue = StorageValue>(base?: string): Storage<T> {
  return useStorage(`lab:fs${base ? `:${base}` : ''}`)
}

export function useFSZlib<T extends StorageValue = StorageValue>(base?: string, options?: ZlibOptions): StorageZlib<T> {
  const fs = useFS<T>(base)
  const { gzip, gunzip } = useZlib(options)

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
    if (input === 'undefined') return fs.removeItem(key)
    const data = await gzip(input, zlibOpts)
    return fs.setItemRaw<Buffer>(key, data, opts)
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
    return fs.getItemRaw<Buffer>(key, opts)
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
    const test = await gunzip<T>(data, zlibOpts)
    return test
  }

  return {
    ...fs,
    setGzip,
    getGzip,
    getGunzip,
  }
}
