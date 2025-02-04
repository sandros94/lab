export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  return useFS('playground').getItem(`${id}.json`)
})
