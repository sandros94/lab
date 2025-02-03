export default defineEventHandler(async () => {
  const kv = useKV()

  await kv.clear()
  const data = await kv.getKeys()

  return data.length
})
