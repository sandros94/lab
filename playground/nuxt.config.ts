export default defineNuxtConfig({
  modules: ['../src/module'],
  imports: { autoImport: true },
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-12-15',

  lab: {
    monacoEditor: true,

    kv: {
      ttl: 10 * 60, // 10 minutes
    },

    zlib: true,

    ws: {
      route: '/_ws',
      channels: {
        internal: ['_internal'],
        defaults: ['session'],
      },
    },
  },
})
