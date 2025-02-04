export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  return useS3('playground-zlib').getGunzip(`${id}.json`)
})
