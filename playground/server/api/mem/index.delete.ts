export default defineEventHandler(async () => {
  const mem = useMem()

  await mem.clear()
  const data = await mem.getKeys()

  return data.length
})
