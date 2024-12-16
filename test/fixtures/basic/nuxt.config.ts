export default defineNuxtConfig({
  modules: [
    '../../../src/module',
  ],

  lab: {
    kv: {
      url: 'redis://@localhost:6379/0',
      ttl: 10 * 60, // 10 minutes
    },
    zlib: true,
  },
})
