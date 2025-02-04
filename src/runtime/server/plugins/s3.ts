import s3Driver from 'unstorage/drivers/s3'

import { defineNitroPlugin, useNitroHooks, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const labConfig = useRuntimeConfig().lab
  const options = labConfig.s3!
  useNitroHooks().callHookSync('lab:s3:config', options)

  // TODO: Customize error based on missing options

  const driver = s3Driver(options)

  storage.unmount('lab:s3')
  storage.mount('lab:s3', driver)
  if (labConfig.cache === 's3') {
    // Also mount as cache driver
    storage.unmount('CACHE')
    storage.mount('CACHE', driver)
  }
})
