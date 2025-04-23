import * as v from 'valibot'

export default defineEventHandler(async (event) => {
  const { id } = await useValidatedParams(event, v.object({
    id: v.string(),
  }))

  await useKV('playground').removeItem(id)
  return { success: true }
})
