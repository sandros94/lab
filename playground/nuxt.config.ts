export default defineNuxtConfig({
  modules: ['../src/module'],
  imports: { autoImport: true },
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-12-15',

  hooks: {
    'lab:cms:scannedFiles'(files) {
      console.log('Scanned files:', JSON.stringify(files, null, 2))
    },
  },

  lab: {
    cache: 'mem', // default `null`

    mem: {
      ttl: 10 * 60, // 10 minutes
    }, // always available

    s3: true,

    kv: {
      ttl: 10 * 60, // 10 minutes
    }, // default `false`

    zlib: true, // default `false`

    valibot: true, // default `false`

    monacoEditor: true, // default `false`

    cms: true, // default `false`
    devPages: true, // default `false`
  },
})
