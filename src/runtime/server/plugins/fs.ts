import fsDriver from 'unstorage/drivers/fs'

import { defineNitroPlugin, useNitroHooks, useRuntimeConfig, useStorage } from '#imports'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const labConfig = useRuntimeConfig().lab
  const options = labConfig.fs!
  useNitroHooks().callHookSync('lab:fs:config', options)

  const driver = fsDriver({
    base: options.base,
    ignore: options.ignore,
    noClear: options.noClear,
    readOnly: options.readOnly,
    watchOptions: options.watchOptions,
  })

  storage.unmount('lab:fs')
  storage.mount('lab:fs', driver)
  if (labConfig.cache === 'fs') {
    // Also mount as cache driver
    storage.unmount('CACHE')
    storage.mount('CACHE', driver)
  }
})
