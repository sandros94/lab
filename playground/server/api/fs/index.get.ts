export default defineEventHandler(() => {
  return useFS('playground').getKeys()
})
