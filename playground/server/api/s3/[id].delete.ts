export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  await useS3('playground').removeItem(`${id}.json`)
  return { success: true }
})
