import * as v from 'valibot'

export default defineEventHandler(async (event) => {
  const body = await useValidatedBody(event, v.record(v.string(), v.any()))
  const { gzip, gunzip } = useZlib()

  const zip = await gzip(body)
  const data = await gunzip(zip)

  return data
})
