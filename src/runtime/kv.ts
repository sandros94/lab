import type { RedisOptions } from 'unstorage/drivers/redis'

/**
 * from upstream DEFAULTS_REDIS_OPTIONS
 * Source: https://github.com/redis/ioredis/blob/1d425da1066dcdd9c944b07424e9042a59cbaa31/lib/redis/RedisOptions.ts#L197-L248
 */

const DEFAULT_KV_OPTIONS: RedisOptions = {
  // Connection
  port: 6379,
  host: 'localhost',
  url: undefined,
  family: 4,
  connectTimeout: 10000,
  disconnectTimeout: 2000,
  keepAlive: 0,
  noDelay: true,
  connectionName: undefined,
  // Sentinel
  sentinels: undefined,
  name: undefined,
  role: 'master',
  natMap: undefined,
  enableTLSForSentinelMode: false,
  updateSentinels: true,
  failoverDetector: false,
  // Status
  username: undefined,
  password: undefined,
  db: 0,
  // Others
  enableOfflineQueue: true,
  enableReadyCheck: true,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
  lazyConnect: false,
  keyPrefix: '',
  reconnectOnError: null,
  readOnly: false,
  stringNumbers: false,
  maxRetriesPerRequest: 20,
  maxLoadingRetryTime: 10000,
  enableAutoPipelining: false,
  autoPipeliningIgnoredCommands: [],
  sentinelMaxConnections: 10,
}

export { type RedisOptions, DEFAULT_KV_OPTIONS }
