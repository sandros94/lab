import { DEFAULT_REDIS_OPTIONS } from 'ioredis/built/redis/RedisOptions'
import type { RedisOptions } from 'unstorage/drivers/redis'

const {
  Connector,
  connectionName,
  sentinels,
  name,
  natMap,
  username,
  password,
  retryStrategy,
  sentinelRetryStrategy,
  sentinelReconnectStrategy,
  ...options
} = DEFAULT_REDIS_OPTIONS

export const DEFAULT_KV_OPTIONS: RedisOptions = {
  ...options,
  connectionName: undefined,
  sentinels: undefined,
  name: undefined,
  natMap: undefined,
  username: undefined,
  password: undefined,
  url: undefined,
}
