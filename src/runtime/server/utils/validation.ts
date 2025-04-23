import type { H3Event } from 'h3'
import type { StandardSchemaV1 } from '@standard-schema/spec'

import { getRouterParams, getQuery, readBody, createError } from '#imports'

export async function useValidatedParams<Schema extends StandardSchemaV1>(event: H3Event, schema: Schema): Promise<StandardSchemaV1.InferOutput<Schema>> {
  const params: StandardSchemaV1.InferInput<Schema> = getRouterParams(event)

  const result = await schema['~standard'].validate(params)

  if (result.issues) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: JSON.stringify(result.issues, null, 2),
    })
  }

  return result.value
}

export async function useValidatedQuery<Schema extends StandardSchemaV1>(event: H3Event, schema: Schema): Promise<StandardSchemaV1.InferOutput<Schema>> {
  const query = getQuery<StandardSchemaV1.InferInput<Schema>>(event)

  const result = await schema['~standard'].validate(query)
  if (result.issues) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: JSON.stringify(result.issues, null, 2),
    })
  }

  return result.value
}

export async function useValidatedBody<Schema extends StandardSchemaV1>(event: H3Event, schema: Schema): Promise<StandardSchemaV1.InferOutput<Schema>> {
  const body = await readBody<StandardSchemaV1.InferInput<Schema>>(event)

  const result = await schema['~standard'].validate(body)
  if (result.issues) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: JSON.stringify(result.issues, null, 2),
    })
  }

  return result.value
}
