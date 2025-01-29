export default defineNuxtConfig({
  modules: ['../src/module'],
  imports: { autoImport: true },
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-12-15',

  lab: {
    monacoEditor: true, // default `false`

    cache: 'mem', // default `null`

    mem: {
      ttl: 10 * 60, // 10 minutes
    },

    kv: {
      ttl: 10 * 60, // 10 minutes
    }, // default `false`

    zlib: true, // default `false`

    ws: {
      route: '/_ws',
      channels: {
        internal: ['_internal'],
        defaults: ['session'],
      },
    }, // default `false`

    valibot: true,
  },
})
