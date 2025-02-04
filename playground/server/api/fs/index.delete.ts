export default defineEventHandler(async () => {
  const fs = useFS()

  await fs.clear()
  const data = await fs.getKeys()

  return data.length
})
