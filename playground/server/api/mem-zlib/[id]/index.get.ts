export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  appendResponseHeader(event, 'Content-Encoding', 'gzip')
  return useMem('mem-zlib').getGzip(id)
})
