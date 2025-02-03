export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  await useMem('playground').removeItem(id)
  return { success: true }
})
