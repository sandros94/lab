import memDriver from '#lab/utils/storage'

import { defineNitroPlugin, useNitroHooks, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const labConfig = useRuntimeConfig().lab
  const options = labConfig.mem || {}
  useNitroHooks().callHookSync('lab:mem:config', options)

  const driver = memDriver(options)

  storage.unmount('MEM')
  storage.mount('MEM', driver)
  if (labConfig.cache === 'mem') {
    // Also mount as cache driver
    storage.unmount('CACHE')
    storage.mount('CACHE', driver)
  }
})
