import { fileURLToPath } from 'node:url'
import { describe, it, expect, assert } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

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
})
