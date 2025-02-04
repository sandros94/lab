export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  appendResponseHeader(event, 'Content-Encoding', 'gzip')
  return useS3('playground-zlib').getGzip(`${id}.json`)
})
