import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('zlib', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig: {
      lab: {
        zlib: true,

        kv: false,
        s3: false,
        monacoEditor: false,
        cms: false,
        devPages: false,
      },
    },
  })

  const dataBody = {
    test: 'Ciao Mondo!',
  }

  it('Successfully gzip and gunzip data', async () => {
    const data = await $fetch('/api/zlib', {
      method: 'POST',
      body: dataBody,
    })

    expect(data).toStrictEqual(dataBody)
  })
})
