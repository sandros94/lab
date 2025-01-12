export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  await useKV('kv').removeItem(id)
  return { success: true }
})