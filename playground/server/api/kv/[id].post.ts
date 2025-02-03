export default defineEventHandler(async (event) => {
  const [{ id }, body] = await Promise.all([
    useValidatedParams(event, v.object({
      id: v.string(),
    })),
    useValidatedBody(event, v.optional(v.record(v.string(), v.any()))),
  ])

  await useKV('playground').setItem(id, body || {})
  return { success: true }
})
