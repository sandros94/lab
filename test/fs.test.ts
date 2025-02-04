import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('fs', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  const dataId = 1994
  const dataBody = {
    test: 'Ciao Mondo!',
  }

  it('Inserts data', async () => {
    const data = await $fetch(`/api/fs/${dataId}`, {
      method: 'POST',
      body: dataBody,
    })
    expect(data).toStrictEqual({ success: true })
  })

  it('Has data', async () => {
    const data = await $fetch('/api/fs')

    expect(data).toContain('1994.json')
  })

  it('Gets data', async () => {
    const data = await $fetch(`/api/fs/${dataId}`)

    expect(data).toStrictEqual(dataBody)
  })

  it('cleared the storage', async () => {
    const data = await $fetch('/api/fs', {
      method: 'DELETE',
    })

    expect(data).toStrictEqual(0)
  })
})
