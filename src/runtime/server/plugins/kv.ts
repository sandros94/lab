import redisDriver from 'unstorage/drivers/redis'

import { defineNitroPlugin, useNitroHooks, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const labConfig = useRuntimeConfig().lab
  const options = labConfig.kv || {}
  useNitroHooks().callHookSync('lab:kv:config', options)

  const driver = redisDriver(options)

  storage.unmount('KV')
  storage.mount('KV', driver)
  if (labConfig.cache === 'kv') {
    // Also mount as cache driver
    storage.unmount('CACHE')
    storage.mount('CACHE', driver)
  }
})
