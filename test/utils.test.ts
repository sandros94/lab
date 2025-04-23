import { createStorage } from 'unstorage'
import { describe, it, expect, assert, afterAll, afterEach } from 'vitest'

import memoryDriver from '../src/runtime/utils/storage'
import { merge, shuffle } from '../src/runtime/utils/array'

describe('utils', async () => {
  describe('array', async () => {
    const names = ['Buonarroti', 'Da Vinci', 'di Niccolò di Betto Bardi', 'Sanzio']
    const fruits = ['Apple', 'Banana', 'Cherry']

    it('Successfully merges names and fruits', () => {
      const data = merge(names, fruits)

      assert.includeMembers([...names, ...fruits], data)
    })

    it('Successfully shuffle names', () => {
      const data = shuffle(names)

      assert.includeMembers(names, data)
    })

    it('Successfully shuffle and pick 2 names', async () => {
      const data = shuffle(names, 2)

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
