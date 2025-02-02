import { fileURLToPath } from 'node:url'

import { createStorage } from 'unstorage'
import { describe, it, expect, assert, afterAll, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

import memoryDriver from '../src/runtime/utils/storage'

describe('utils', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  describe('array', async () => {
    const names = ['Buonarroti', 'Da Vinci', 'di Niccolò di Betto Bardi', 'Sanzio']
    const fruits = ['Apple', 'Banana', 'Cherry']

    it('Successfully merges names and fruits', async () => {
      const data = await $fetch<string[]>('/api/utils/array/merge', {
        method: 'POST',
        body: {
          arrayA: names,
          arrayB: fruits,
        },
      })

      assert.includeMembers([...names, ...fruits], data)
    })

    it('Successfully shuffle names', async () => {
      const data = await $fetch<string[]>('/api/utils/array/shuffle', {
        method: 'POST',
        body: {
          array: names,
        },
      })

      assert.includeMembers(names, data)
    })

    it('Successfully shuffle and pick 2 names', async () => {
      const data = await $fetch<string[]>('/api/utils/array/shuffle', {
        method: 'POST',
        body: {
          array: names,
          limit: 2,
        },
      })

      assert.includeMembers(names, data)
      expect(data).toHaveLength(2)
    })
  })

  describe('storage', () => {
    const storage = createStorage({
      driver: memoryDriver({ ttlAutoPurge: true, meta: true }),
    })

    afterAll(async () => {
      await storage.dispose()
    })

    afterEach(async () => {
      await storage.clear()
    })

    it('Successfully sets and gets a key', async () => {
      await storage.setItem('key', 'value')
      const data = await storage.getItem('key')

      expect(data).toEqual('value')
    })

    it('Successfully supports meta', async () => {
      await storage.setItem('key', 'value')
      const meta = await storage.getMeta('key')

      expect(meta.birthtime).toBeInstanceOf(Date)
    })

    it('Successfully sets and gets a key within ttl', async () => {
      await storage.setItem('key', 'value', { ttl: 1000 })
      await new Promise(resolve => setTimeout(resolve, 500))

      const meta = await storage.getMeta('key')
      expect(meta.ttl).toBeLessThan(1000)

      await new Promise(resolve => setTimeout(resolve, 501))

      const dataAfter = await storage.getItem('key')
      expect(dataAfter).toBeNull()
    })
  })
})
