import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, it, expect } from 'vitest'

describe('kv-zlib', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig: {
      // @ts-expect-error `@nuxt/test-utils` types don't include local modules
      lab: {
        zlib: true,
        kv: true,

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

  it('Successfully gzip data', async () => {
    const data = await $fetch(`/api/kv-zlib/${dataId}`, {
      method: 'POST',
      body: dataBody,
    })

    expect(data).toStrictEqual({ success: true })
  })

  it('Gets gzip data', async () => {
    const data = await $fetch(`/api/kv-zlib/${dataId}`)

    expect(data).toStrictEqual(dataBody) // $fetch will take care to gunzip the return
  })

  it('Gets gunzip data', async () => {
    const data = await $fetch(`/api/kv-zlib/${dataId}/unzip`)

    expect(data).toStrictEqual(dataBody)
  })

  it('cleared the storage', async () => {
    const data = await $fetch('/api/kv', {
      method: 'DELETE',
    })

    expect(data).toStrictEqual(0)
  })
})
