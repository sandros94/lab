import type { TransactionOptions } from 'unstorage'
import { uint8ArrayToBase64 } from 'undio'

import { type ZlibOptions, useZlib } from './zlib'
import { useStorage } from '#imports'

function useKV(base?: string) {
  return useStorage(base ? `CACHE:${base}` : 'CACHE')
}

function useKVZlib(base?: string, options?: ZlibOptions) {
  const kv = useStorage(base ? `CACHE:${base}` : 'CACHE')
  const { gzip, gunzip } = useZlib(options)

  async function setGzip(
    key: string,
    input: undefined,
    kvOpts?: (TransactionOptions & {
      removeMeta?: boolean
    }) | boolean,
    zlibOpts?: never,
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
    return kv.setItem(key, serializeRaw(data), kvOpts)
  }

  async function getGzip<T extends (Buffer | string)>(
    key: string,
    kvOpts?: TransactionOptions,
  ) {
    return kv.getItemRaw<T>(key, kvOpts)
  }

  async function getGunzip<T = any>(
    key: string,
    kvOpts?: TransactionOptions,
    zlibOpts?: ZlibOptions,
  ): Promise<string | null | T> {
    const data = await getGzip(key, kvOpts)
    if (data === null || typeof data === 'string') return data
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
/**
 * End `unjs/unstorage` implementation
 */

export { type TransactionOptions, useKV, useKVZlib }
