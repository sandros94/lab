export default defineEventHandler(() => {
  return useKV().getKeys()
})
