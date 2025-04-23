import { queryStaticContent } from './utils'
import { createError, defineEventHandler } from '#imports'

export default defineEventHandler(async (event) => {
  const slug = event.path.replace('/_cms', '')
  const data = await queryStaticContent(slug)

  if (!data) {
    throw createError({
      status: 404,
      message: 'Not found',
    })
  }

  return data
})
