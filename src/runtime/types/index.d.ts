export type { MultiState } from '../app/composables/multi-state'
export type * from './kv'
export type * from './ws'

export type MaybeDefined<T> = T extends any ? T : any
export type Fallback<T, D> = T extends any ? D : T

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P]
}
