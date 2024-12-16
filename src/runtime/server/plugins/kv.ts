import redisDriver from 'unstorage/drivers/redis'

import { defineNitroPlugin, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()

  const driver = redisDriver(useRuntimeConfig().lab.kv)

  // Mount driver as cache
  storage.unmount('CACHE')
  storage.mount('CACHE', driver)
})
