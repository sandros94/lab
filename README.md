# Sandros94 LAB

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A personal collection of Nuxt and Nitro tools.
The goal of this project is mainly to simplify my prototyping process and learn a few things about data manipulation, Vitest, CI and others in a _laboratory-like_ environment.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/sandros94/lab?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

- `useKV`: integrates any Redis compatible KV stores, build on-top of [`unstorage`](https://github.com/unjs/unstorage) and editable via `runtimeConfig` (server-only).
  - **Gzip Compression/Decompression**: taking advantage of `node:zlib` it provides a set of functions to `useKV` to automatically store and retrive compressed data (server-only).
- `useZlib`: used under the hood by `useKV` to provide gzip support during KV store operations.
- `useWS`+`useWebSocketHandler` ([demo](https://reactive-ws.s94.dev/)): A WebSocket implementation with built-in shared state management, channel subscriptions, and type safety.
- **Built-in validation**: using [`valibot`](https://valibot.dev) and [`h3-valibot`](https://github.com/intevel/h3-valibot) under the hood (client and server).

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add @sandros94/lab
```

To enable or disable various features you can simply edit your `nuxt.config.ts` like so:

```ts
export default defineNuxtConfig({
  modules: ['@sandros94/lab'],

  lab: {
    kv: true,     // default false
    zlib: true,   // default false
    valibot: true // default true
  }
})
```

`lab.kv` and `lab.zlib` also accept an object to edit their defaults.

```ts
export default defineNuxtConfig({
  modules: ['@sandros94/lab'],

  lab: {
    kv: {
      ttl: 10 * 60,
    }
  }
})
```

You can also edit them via env vars: `NUXT_LAB_KV_*` and `NUXT_LAB_ZLIB_*`. Useful in situations like editing `NUXT_LAB_KV_URL` without rebuilding the application.

## Utils

The `@sandros94/lab` module includes some utility functions:

### `useKV`

Based on `useStorage` when combined with `zlib` it also receives the following functions:

- `setGzip`: Compresses data using gzip and stores it in the KV store.
- `getGzip`: Retrieves compressed data from the KV store without decompressing it.
- `getGunzip`: Retrieves compressed data from the KV store, decompresses it, and returns the original data.

### `useZlib`

Mainly used internally for `useKV`, it currently only provides the following functions:

- `gzip`: Compresses data using gzip.
- `gunzip`: Decompresses gzip-compressed data.

## Real-time Remote State Management

A WebSocket implementation with built-in shared state management, channel subscriptions, and type safety.

- 🔄 Automatic reconnection
- 📦 Built-in shared state management per channel
- 🔐 Type-safe messages and channels
- 📢 Hooking system to trigger global or per-channel messages
- 💾 Easily add persistent storage with `useKV`

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@sandros94/lab'],
  lab: {
    ws: {
      route: '/_ws',             // WebSocket endpoint
      channels: {
        internal: ['_internal'], // Protected system channels
        defaults: ['session'],   // Auto-subscribed channels
      }
    }
  }
})
```

Client-Side:
```ts
// Request additional channels during connection
const channels = ref(['chat', 'notifications'])

const { states, status, send } = useWS<{
  chat: {
    [userId: string]: string
  }
  notifications: {
    message: string
  }
}>(channels)

// Send message to chat channel
send('chat', { 
  [userId]: 'Hello world!'
})

// Access state
const chatMessages = toRef(states, 'chat')
```

Server-Side:
```ts
// server/routes/_ws.ts
export default useWebSocketHandler({
  async open(peer, { channels }) {
    // Subscribe to requested channels
    channels.forEach(channel => peer.subscribe(channel))
  },

  async message(peer, message, { channels }) {
    const { channel, data } = message.json()
    // Broadcast to channel subscribers
    peer.publish(channel, JSON.stringify({ channel, data }))
  }
})
```

#### Reactivity notes

The `state` object returned by `useWS` (and `useWSStates`) is not reactive, while its properties are indeed refs. This means that as long as you are accessing static channels you can safely destructure them, but not if they are based on dynamic ones.

```ts
// The following works
const { states } = useWS<{
  chat: {    // Defined here
    [userId: string]: string
  }
  session: { // Defined in nuxt.config.ts via `lab.ws.channels.defaults`
    user: number
  }
}>(['chat'])
const { chat, session } = states

// The following does not work
const selectedChannels = ref([])
const { states } = useWS<{
  [channel: string]: {
    [key: string]: string
  }
}>(selectedChannels)
const { myDynamicChannel } = states

// Instead you should access it directly as
states['myDynamicChannel']
```


## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>

## License

Published under the [MIT](/LICENSE) license.


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@sandros94/lab/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@sandros94/lab

[npm-downloads-src]: https://img.shields.io/npm/dm/@sandros94/lab.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/@sandros94/lab

[license-src]: https://img.shields.io/npm/l/@sandros94/lab.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@sandros94/lab

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
