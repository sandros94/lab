import type { ZlibOptions } from 'node:zlib'
import type { TransactionOptions, Storage, StorageValue } from 'unstorage'

import type { MaybeDefined } from '.'

export type { InputType } from 'node:zlib'
export type { RedisOptions } from 'unstorage/drivers/redis'

export interface StorageZlib<T extends StorageValue = StorageValue> extends Storage<T> {
  setGzip(key: string, input: undefined, kvOpts?: (TransactionOptions & { removeMeta?: boolean }) | boolean, zlibOpts?: ZlibOptions): Promise<void>
  setGzip(key: string, input: any, kvOpts?: TransactionOptions, zlibOpts?: ZlibOptions): Promise<void>
  getGzip<U extends (Buffer | string)>(key: string, kvOpts?: TransactionOptions): Promise<MaybeDefined<U> | null>
  getGunzip<U extends T>(key: string, kvOpts?: TransactionOptions, zlibOpts?: ZlibOptions): Promise<U | null>
}

export type { TransactionOptions, Storage, StorageValue, ZlibOptions }
