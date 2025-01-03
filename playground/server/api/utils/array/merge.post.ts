import { merge } from '#lab/utils'

export default defineEventHandler(async (event) => {
  const { arrayA, arrayB } = await useValidatedBody(event, v.object({
    arrayA: v.array(v.any()),
    arrayB: v.array(v.any()),
  }))

  return merge(arrayA, arrayB)
})
