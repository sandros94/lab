import redisDriver from 'unstorage/drivers/redis'

import { defineNitroPlugin, useNitroHooks, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const options = useRuntimeConfig().lab.kv || {}
  useNitroHooks().callHookSync('lab:kv:config', options)

  const driver = redisDriver(options)

  // Mount driver as cache
  storage.unmount('CACHE')
  storage.mount('CACHE', driver)
})
