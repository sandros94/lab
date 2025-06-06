import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('mem', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig: {
      // @ts-expect-error `@nuxt/test-utils` types don't include local modules
      lab: {
        zlib: false,
        kv: false,
        s3: false,
        monacoEditor: false,
        cms: false,
        devPages: false,
      },
    },
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

    expect(data).toContain('1994')
  })

  it('Gets data', async () => {
    const data = await $fetch(`/api/mem/${dataId}`)

    expect(data).toStrictEqual(dataBody)
  })

  it('cleared the storage', async () => {
    const data = await $fetch('/api/mem', {
      method: 'DELETE',
    })

    expect(data).toStrictEqual(0)
  })
})
