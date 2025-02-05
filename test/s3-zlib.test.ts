import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, it, expect, afterAll } from 'vitest'

describe.runIf(process.env.NUXT_LAB_S3_ENDPOINT && process.env.NUXT_LAB_S3_REGION && process.env.NUXT_LAB_S3_BUCKET && process.env.NUXT_LAB_S3_ACCESS_KEY_ID && process.env.NUXT_LAB_S3_SECRET_ACCESS_KEY)('s3-zlib', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  const dataId = 1994
  const dataBody = {
    test: 'Ciao Mondo!',
  }

  afterAll(async () => {
    await $fetch('/api/s3-zlib', {
      method: 'DELETE',
    })
  })

  it('Successfully gzip data', async () => {
    const data = await $fetch(`/api/s3-zlib/${dataId}`, {
      method: 'POST',
      body: dataBody,
    })

    expect(data).toStrictEqual({ success: true })
  })

  it('Gets gzip data', async () => {
    const data = await $fetch(`/api/s3-zlib/${dataId}`)

    expect(data).toStrictEqual(dataBody) // $fetch will take care to gunzip the return
  })

  it('Gets gunzip data', async () => {
    const data = await $fetch(`/api/s3-zlib/${dataId}/unzip`)

    expect(data).toStrictEqual(dataBody)
  })
})
