import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe.runIf(process.env.NUXT_LAB_S3_ENDPOINT && process.env.NUXT_LAB_S3_REGION && process.env.NUXT_LAB_S3_BUCKET && process.env.NUXT_LAB_S3_ACCESS_KEY_ID && process.env.NUXT_LAB_S3_SECRET_ACCESS_KEY)('s3', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  const dataId = 1994
  const dataBody = {
    test: 'Ciao Mondo!',
  }

  it('Inserts data', async () => {
    const data = await $fetch(`/api/s3/${dataId}`, {
      method: 'POST',
      body: dataBody,
    })
    expect(data).toStrictEqual({ success: true })
  })

  it('Has data', async () => {
    const data = await $fetch('/api/s3')

    expect(data).toContain('1994.json')
  })

  it('Gets data', async () => {
    const data = await $fetch(`/api/s3/${dataId}`)

    expect(data).toStrictEqual(dataBody)
  })

  // it('cleared the storage', async () => {
  //   const data = await $fetch('/api/s3', {
  //     method: 'DELETE',
  //   })

  //   expect(data).toStrictEqual(0)
  // })
})
