import memDriver from '#lab/utils/storage'

import { defineNitroPlugin, useNitroHooks, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const labConfig = useRuntimeConfig().lab
  const options = labConfig.mem || {}
  useNitroHooks().callHookSync('lab:mem:config', options)

  const driver = memDriver(options)

  if (labConfig.cache === 'mem') {
    // Mount driver as cache
    storage.unmount('CACHE')
    storage.mount('CACHE', driver)
  }
  else {
    // Mount driver as MEMORY
    storage.unmount('MEMORY')
    storage.mount('MEMORY', driver)
  }
})
