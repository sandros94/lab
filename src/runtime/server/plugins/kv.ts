import redisDriver from 'unstorage/drivers/redis'
import { defu } from 'defu'

import { defineNitroPlugin, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const kv = useRuntimeConfig().kv
  const storage = useStorage()

  const driver = redisDriver(defu(kv, {
    name: 'kv',
    ttl: 60 * 60 * 6, // 6 hours
  }))

  // Mount driver as cache
  storage.unmount('CACHE')
  storage.mount('CACHE', driver)
})
