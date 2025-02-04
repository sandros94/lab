export default defineEventHandler(() => {
  return useS3('playground').getKeys()
})
