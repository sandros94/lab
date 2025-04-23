import * as v from 'valibot'

export default defineEventHandler(async (event) => {
  const [{ id }, body] = await Promise.all([
    useValidatedParams(event, v.object({
      id: v.string(),
    })),
    useValidatedBody(event, v.optional(v.record(v.string(), v.any()))),
  ])

  await useMem('playground').setItem(id, body || {})
  return { success: true }
})
