import redisDriver from 'unstorage/drivers/redis'

import { defineNitroPlugin, useNitroHooks, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const labConfig = useRuntimeConfig().lab
  const options = labConfig.kv || {}
  useNitroHooks().callHookSync('lab:kv:config', options)

  const driver = redisDriver(options)

  if (labConfig.cache === 'kv') {
    // Mount driver as cache
    storage.unmount('CACHE')
    storage.mount('CACHE', driver)
  }
  else {
    // Mount driver as KV
    storage.unmount('KV')
    storage.mount('KV', driver)
  }
})
