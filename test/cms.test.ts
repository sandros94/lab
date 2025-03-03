import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, it, expect } from 'vitest'

describe('cms', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  it('Successfully fetch parsed yaml', async () => {
    const data = await $fetch(`/_cms/test`)

    expect(data).toStrictEqual({
      type: 'yaml',
      content: {
        services: {
          first: {
            class: 'FirstService',
            arguments: [
              '@second',
              '@third',
            ],
          },
          second: {
            class: 'SecondService',
            arguments: [
              '@fourth',
              '@fifth',
            ],
          },
        },
      },
    })
  })
})
