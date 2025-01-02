import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('utils', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  describe('array', async () => {
    const names = ['Buonarroti', 'Da Vinci', 'di Niccolò di Betto Bardi', 'Sanzio']

    it('Successfully shuffle names', async () => {
      const data = await $fetch('/api/utils/array/shuffle', {
        method: 'POST',
        body: {
          array: names,
        },
      })

      expect(data).toEqual(expect.arrayContaining(names))
    })
  })
})
