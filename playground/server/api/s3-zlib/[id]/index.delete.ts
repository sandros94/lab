import * as v from 'valibot'

export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  await useS3('playground-zlib').removeItem(`${id}.json.gz`)
  return { success: true }
})
