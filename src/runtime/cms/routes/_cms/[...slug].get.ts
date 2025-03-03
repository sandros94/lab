export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || 'index'
  const data = await queryStaticContent(slug)

  if (!data) {
    throw createError({
      status: 404,
      message: 'Not found',
    })
  }

  return data
})
