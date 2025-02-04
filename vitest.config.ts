import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    setupFiles: ['dotenv/config'],
    include: ['test/**/*.test.ts'],
  },
})
