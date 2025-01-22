import { createHooks } from 'hookable'
import { getQuery } from 'ufo'
import { destr } from 'destr'

import { defineWebSocketHandler, useRuntimeConfig } from '#imports'
import type {
  Peer,
  WSRuntimeConfig,
  WSHandlerHooks,
  WSHooks,
} from '#lab/types'

/**
 * Define a custom WebSocket event handler.
 * This implementation also includes automatic subscription to internal and default channels.
 *
 * @see — https://h3.unjs.io/guide/websocket
 */
export function defineReactiveWSHandler(hooks: Partial<WSHandlerHooks>) {
  let config: WSRuntimeConfig

  const getConfig = () => {
    if (config) return config
    return config = useRuntimeConfig().public.lab.ws as WSRuntimeConfig
  }

  // TODO: get runtimeConfig channels and merge them with defaultChannels

  return defineWebSocketHandler({
    upgrade: req => hooks.upgrade?.(req),

    async open(peer) {
      const config = getConfig()

      // Automatically subscribe to internal and default channels
      config.channels.internal.forEach(channel => peer.subscribe(channel))
      config.channels.defaults.forEach(channel => peer.subscribe(channel))

      // Get channels
      const channels = getWSChannels(peer.websocket.url)

      // Setup notification hooks
      wsHooks.hook('all', (...messages) => {
        for (const { channel, data } of messages) {
          wsBroadcast(
            peer,
            channel,
            JSON.stringify({
              channel,
              data,
            }),
            { compress: true },
          )
        }
      })
      wsHooks.hook('internal', (...messages) => {
        for (const { channel, data } of messages) {
          if (!config.channels.internal.includes(channel)) return
          wsBroadcast(
            peer,
            channel,
            JSON.stringify({
              channel,
              data,
            }),
            { compress: true },
          )
        }
      })

      return hooks.open?.(peer, { channels, config })
    },

    message(peer, message) {
      const config = getConfig()
      const m = destr<any>(message.text())
      if (m?.channel && config.channels.internal.includes(m.channel)) return
      const channels = getWSChannels(peer.websocket.url)

      return hooks.message?.(peer, message, { channels, config })
    },

    async close(peer, details) {
      // TODO: is it really needed to unsubscribe from all channels?
      const config = getConfig()
      const channels = getWSChannels(peer.websocket.url)

      return hooks.close?.(peer, details, { channels, config })
    },

    error: (peer, error) => hooks.error?.(peer, error),
  })
}

// TODO: remove on next major release
/**
 * Deprecated, use `defineReactiveWSHandler` instead
 *
 * @deprecated Use `defineReactiveWSHandler` instead
 */
export function useWebSocketHandler(hooks: Partial<WSHandlerHooks>) {
  return defineReactiveWSHandler(hooks)
}

/**
 * Extracts channel names from WebSocket URL query parameters
 *
 * @param {string} [url] - WebSocket connection URL
 * @returns {string[]} Array of channel names
 */
export function getWSChannels(url?: string): string[] {
  if (!url) return []

  const { channels } = getQuery<{
    channels?: string | string[]
  }>(url)

  return channels === undefined
    ? []
    : Array.isArray(channels)
      ? channels
      : [channels]
}

/**
 * Broadcasts a message to peers subscribed to a specific topic only once.
 *
 * @param {Peer} peer - WebSocket peer instance
 * @param {string} topic - Topic/channel to broadcast to
 * @param {any} message - Message to broadcast
 * @param {object} [options] - Broadcast options
 * @param {boolean} [options.compress] - Whether to compress the message
 */
export function wsBroadcast(
  peer: Peer,
  topic: string,
  message: any,
  options?: {
    compress?: boolean
  },
) {
  let firstPeer: Peer | null = null

  for (const _peer of peer.peers) {
    if (_peer['_topics'].has(topic)) {
      firstPeer = _peer
      break
    }
  }

  if (firstPeer?.id === peer.id) {
    firstPeer.send(message, options)
    firstPeer.publish(topic, message, options)
  }
}

export const wsHooks = createHooks<WSHooks>()
