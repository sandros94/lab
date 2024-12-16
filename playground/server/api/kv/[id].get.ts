export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  return useKV('kv').getItem(id)
})
