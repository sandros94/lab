import type { PublicRuntimeConfig } from 'nuxt/schema'
import type { UseWebSocketOptions, UseWebSocketReturn } from '@vueuse/core'
import type { Peer, Hooks, Message } from 'crossws'
import type { MultiState } from '.'

type MaybePromise<T> = T | Promise<T>

// Make all nested properties required and non-nullable
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends undefined
    ? Required<T[K]>
    : DeepRequired<T[K]>
}

export type { Peer, Hooks, Message }

// Combine the utility types to get the final WSRuntimeConfig
export type LabRuntimeConfig = DeepRequired<PublicRuntimeConfig['lab']>
export type WSRuntimeConfig = LabRuntimeConfig['ws']
export type InternalChannels = WSRuntimeConfig['channels']['internal'][number]
export type DefaultChannels = WSRuntimeConfig['channels']['defaults'][number]
export type AllChannels = DefaultChannels | InternalChannels

export interface WSConfig {
  route?: string
  channels?: {
    defaults?: Array<string>
    internal?: Array<string>
  }
}

export interface WSOptions extends UseWebSocketOptions {
  route?: string
  prefix?: string
  query?: Record<string, any>
}

export interface UseWSReturn<T extends Record<string | AllChannels, any>, D> extends Omit<UseWebSocketReturn<D>, 'send'> {
  states: MultiState<T>
  send<M extends (object | string)>(data: M): boolean
  send<M extends WSMessage<T>>(channel: M['channel'], data: M['data']): boolean
  _send: UseWebSocketReturn<D>['send']
}

export interface WSMessage<T extends Record<string | AllChannels, any> = Record<string | AllChannels, any>> {
  channel: keyof T
  data: T[keyof T]
}

export interface WSHandlerHooks extends Partial<Omit<Hooks, 'open' | 'close' | 'message'>> {
  // TODO: add other hooks

  /** A socket is opened */
  open: (peer: Peer, config: { channels: string[], config: WSRuntimeConfig }) => MaybePromise<void>

  /** A message is received */
  message: (peer: Peer, message: Message, config: { channels: string[], config: WSRuntimeConfig }) => MaybePromise<void>

  /** A socket is closed */
  close: (peer: Peer, details: {
    code?: number
    reason?: string
  }, config: { channels: string[], config: WSRuntimeConfig }) => MaybePromise<void>
}

export type ChannelHooks = {
  [K in AllChannels]: (...messages: { channel: K, data: unknown }[]) => MaybePromise<void>
}

export interface WSHooks extends ChannelHooks {
  all(...message: { channel: AllChannels, data: unknown }[]): MaybePromise<void>
  internal(...message: { channel: InternalChannels, data: unknown }[]): MaybePromise<void>
}
