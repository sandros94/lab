export default defineEventHandler(() => {
  return useFS('playground-zlib').getKeys()
})
