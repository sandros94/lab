import { useWebSocket } from '@vueuse/core'
import { destr } from 'destr'
import {
  joinURL,
  withProtocol,
  withQuery,
} from 'ufo'

import type { Ref, MaybeRef } from '#imports'
import {
  computed,
  reactive,
  ref,
  toRef,
  watch,
  useState,
  useRequestURL,
  useRuntimeConfig,
} from '#imports'
import { useMultiState } from '#lab/app/composables/multi-state'
import { merge } from '#lab/utils'
import type {
  AllChannels,
  MultiState,
  WSRuntimeConfig,
  WSMessage,
  WSOptions,
  UseWSReturn,
} from '#lab/types'

const stateKeyPrefix = ':ws:'

/**
 * Create multiple global reactive refs that will be hydrated but not shared across ssr requests
 * Each state is based on the available channels defined in the runtime configuration or via `useWS`
 *
 * @template T - Type of the channel data mapping
 * @param {MaybeRef<Array<keyof T | string>>} [channels] - Array of channel names to subscribe to
 * @param {object} [options] - Configuration options
 * @param {string} [options.prefix] - Prefix for state keys
 * @returns {MultiState<T>} Reactive state object for the channels
 */
export function useWSState<
  T extends Record<string | AllChannels, any>,
>(channels?: MaybeRef<Array<keyof T | string>>, options?: { prefix?: string }): MultiState<T> {
  const { defaults, internal } = useRuntimeConfig().public.lab.ws?.channels as WSRuntimeConfig['channels']
  const _channels = toRef(channels || [])

  const mergedChannels = computed(
    () => merge(internal, [...defaults, ..._channels.value]) as (string | AllChannels)[],
  )
  return useMultiState<T>(mergedChannels, { prefix: options?.prefix || stateKeyPrefix })
}

/**
 * Creates a WebSocket connection with shared state management for each channel.
 * Each state is based on the available channels defined in the runtime configuration or via `useWSState`.
 *
 * @template T - Type of the channel data mapping
 * @param {MaybeRef<Array<keyof T | string>>} [channels] - Array of channel names to subscribe to
 * @param {WSOptions} [options] - WebSocket connection options
 * @returns {UseWSReturn<T>} WebSocket connection and state management utilities
 * @property {ReturnType<typeof useWSState<T>>} states - Reactive state for each channel
 * @property {Ref<any>} data - Raw WebSocket data
 * @property {Ref<WebSocket['readyState']>} status - WebSocket connection status
 * @property {(channel: string, data: any) => void} send - Send data to a specific channel
 * @property {(data: string | ArrayBufferLike | Blob | ArrayBufferView) => void} _send - Raw send function
 * @property {() => void} open - Open the WebSocket connection
 * @property {() => void} close - Close the WebSocket connection
 * @property {WebSocket} ws - Raw WebSocket instance
 * @throws {Error} When route is not configured
 */
export function useWS<
  T extends Record<string | AllChannels, any>,
  D = any,
>(
  channels?: MaybeRef<Array<keyof T | string>>,
  options?: WSOptions,
): UseWSReturn<T, D> {
  const { route } = useRuntimeConfig().public.lab.ws as WSRuntimeConfig
  const { query, route: optsRoute, prefix, ...opts } = options || {}
  const path = optsRoute || route

  if (!path) {
    throw new Error('[useWS] `route` is required in options or `nuxt.config.ts`')
  }

  const _channels = channels === undefined
    ? ref<string[]>([])
    : toRef(channels) as Ref<Array<keyof T>>
  const states = useWSState<T>(_channels, { prefix })

  const _query = reactive({
    ...query,
    channels: _channels,
  })
  const reqUrl = useRequestURL()
  const origin = joinURL(reqUrl.origin, path)
  const url = computed(() => {
    return withQuery(
      reqUrl.protocol === 'https:'
        ? withProtocol(origin, 'wss://')
        : withProtocol(origin, 'ws://'),
      _query,
    )
  })

  const {
    status,
    data,
    send: _send,
    open,
    close,
    ws,
  } = useWebSocket(url, {
    ...opts,
    onMessage(_, message) {
      const parsed = destr<WSMessage<T>>(message.data)
      if (!!parsed && typeof parsed === 'object' && 'channel' in parsed && 'data' in parsed) {
        if (states[parsed.channel] === undefined)
          useState((prefix || stateKeyPrefix) + String(parsed.channel), () => parsed.data)
        else
          states[parsed.channel].value = parsed.data
      }

      opts?.onMessage?.(_, message)
    },
    autoConnect: false,
  })

  /**
   * Sends raw message data through the WebSocket connection.
   * Messages are buffered if connection is not yet established.
   *
   * @template M - Type extending string | ArrayBuffer | Blob | object
   * @param {M} data - Raw message to send
   * @returns {boolean} Success status of the send operation
   *
   * @example
   * send("Hello World")
   * send(new Blob(['Hello']))
   * send({ type: "message", content: "Hello" })
   */
  function send<M extends string | ArrayBuffer | Blob | object>(data: M): boolean
  /**
   * Sends data to a specific WebSocket channel.
   * Messages are buffered if connection is not yet established.
   *
   * @template M - Type extending WSMessage<T>
   * @param {M['channel']} channel - Target channel name
   * @param {M['data']} data - Data to send to the channel
   * @returns {boolean} Success status of the send operation
   *
   * @example
   * send("notifications", { id: 1, text: "New message" })
   * send("chat", { message: "Hello", user: "John" })
   */
  function send<M extends WSMessage<T>>(channel: M['channel'], data: M['data']): boolean
  function send<M extends WSMessage<T>>(...args: any): boolean {
    if (args.length === 1) {
      const data = args[0]
      if (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof ArrayBuffer))
        return _send(JSON.stringify(data), true)
      return _send(data)
    }

    const [channel, data] = args as [M['channel'] | undefined, M['data']]
    return _send(JSON.stringify({ channel, data }), true)
  }

  if (opts?.autoConnect !== false)
    watch(url, () => {
      close()
      setTimeout(() => open(), 100)
    })

  return {
    states,
    data,
    status,
    send,
    _send,
    open,
    close,
    ws,
  }
}
