import { shuffle } from '#lab/utils'

export default defineEventHandler(async (event) => {
  const { array, limit } = await useValidatedBody(event, v.object({
    array: v.array(v.any()),
    limit: v.optional(v.number()),
  }))

  const shuffled = shuffle(array, limit)
  return shuffled
})
