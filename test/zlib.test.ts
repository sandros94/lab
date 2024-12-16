import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('zlib', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
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
