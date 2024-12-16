export default defineNuxtConfig({
  modules: ['../src/module'],
  imports: { autoImport: true },
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-12-15',

  lab: {
    kv: true,
    zlib: true,
  },
})
