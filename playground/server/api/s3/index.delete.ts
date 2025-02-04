export default defineEventHandler(async () => {
  const fs = useS3()

  await fs.clear()
  const data = await fs.getKeys()

  return data.length
})
