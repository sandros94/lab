import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('mem', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  const dataId = 1994
  const dataBody = {
    test: 'Ciao Mondo!',
  }

  it('Inserts data', async () => {
    const data = await $fetch(`/api/mem/${dataId}`, {
      method: 'POST',
      body: dataBody,
    })
    expect(data).toStrictEqual({ success: true })
  })

  it('Has data', async () => {
    const data = await $fetch('/api/mem')

    expect(data).toContain('mem:1994')
  })

  it('Gets data', async () => {
    const data = await $fetch(`/api/mem/${dataId}`)

    expect(data).toStrictEqual(dataBody)
  })
})
