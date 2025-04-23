import { queryStaticContent } from '../utils'
import { createError, defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  const data = await queryStaticContent()

  if (!data) {
    throw createError({
      status: 404,
      message: 'Not found',
    })
  }

  return data
})
