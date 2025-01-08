import type { InputType, ZlibOptions } from 'node:zlib'
import type { TransactionOptions, Storage, StorageValue } from 'unstorage'

export type MaybeDefined<T> = T extends any ? T : any

export interface StorageZlib<T extends StorageValue = StorageValue> extends Storage<T> {
  setGzip(key: string, input: undefined, kvOpts?: (TransactionOptions & { removeMeta?: boolean }) | boolean, zlibOpts?: ZlibOptions): Promise<void>
  setGzip(key: string, input: any, kvOpts?: TransactionOptions, zlibOpts?: ZlibOptions): Promise<void>
  getGzip<U extends (Buffer | string)>(key: string, kvOpts?: TransactionOptions): Promise<MaybeDefined<U> | null>
  getGunzip<U extends T>(key: string, kvOpts?: TransactionOptions, zlibOpts?: ZlibOptions): Promise<U | null>
}

export type { InputType, TransactionOptions, Storage, StorageValue, ZlibOptions }
