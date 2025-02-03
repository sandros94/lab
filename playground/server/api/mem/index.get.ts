export default defineEventHandler(() => {
  return useMem('playground').getKeys()
})
