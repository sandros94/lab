import { consola } from 'consola'

export * from './array'

export const logger = consola.create({}).withTag('lab')
