export default defineEventHandler(() => {
  return useKV('playground').getKeys()
})
