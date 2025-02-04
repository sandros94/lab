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

- `useMem`: integrates an in-memory kv store, build on-top of [`unstorage`](https://github.com/unjs/unstorage) and editable via `runtimeConfig` (server-only).
- `useFS`: integrates a filesystem storage, build on-top of [`unstorage`](https://github.com/unjs/unstorage) and editable via `runtimeConfig` (server-only).
- `useS3` (optional): integrates any S3 compatible storage, build on-top of [`unstorage`](https://github.com/unjs/unstorage) and editable via `runtimeConfig` (server-only).
- `useKV` (optional): integrates any Redis compatible KV stores, build on-top of [`unstorage`](https://github.com/unjs/unstorage) and editable via `runtimeConfig` (server-only).
- `useZlib` (optional): when enabled, it automatically provides gzip compression and decompression functions to `useMem`, `useFS` and `useKV` (server-only).
- `useWS`+`useWebSocketHandler` ([demo](https://reactive-ws.s94.dev/), optional): A WebSocket implementation with built-in shared state management, channel subscriptions, and type safety.
- **Built-in validation** (optional): using [`valibot`](https://valibot.dev) and [`h3-valibot`](https://github.com/intevel/h3-valibot) under the hood (client and server).

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
    cache: 'kv',  // 'mem', 'fs', 'kv' or null (default)
    s3: true,     // default false
    kv: true,     // default false
    zlib: true,   // default false
    valibot: true // default true
  }
})
```

`lab.mem`, `lab.kv` and `lab.zlib` also accept an object to edit their defaults options.

```ts
export default defineNuxtConfig({
  modules: ['@sandros94/lab'],

  lab: {
    mem: {
      ttl: 10 * 60,
    },
    fs: {
      base: '.data/myStore', // Default '.data/lab'
    },
    s3: {
      endpoint: 'https://example.com',
      region: 'us-east-1',
      bucket: 'myBucket',
      accessKeyId: '<your-access-key>',      // Best to use env vars
      secretAccessKey: '<your-secret-key>',  // Best to use env vars
    },
    kv: {
      ttl: 10 * 60,
    }
  }
})
```

You can also edit them via env vars: `NUXT_LAB_{MEM|FS|S3|KV|ZLIB}_*`. Useful in situations like editing `NUXT_LAB_KV_URL` at runtime without rebuilding the application.

## Utils

The `@sandros94/lab` module includes some utility functions:

### `useMem`

Based on [`unstorage`](https://github.com/unjs/unstorage) is a custom in-memory driver. It provides added functionality like time-based metadata, optional size calculation and TTL support with auto-purge.

```ts
const mem = useMem()

mem.setItem('key', 'value', { ttl: 60 }) // Expires in 60 seconds

const meta = mem.getMeta('key') // { ttl, atime, mtime, ctime, birthtime, size, timeoutId }
```

When combined with `zlib` it also receives the following functions:

- `setGzip`: Compresses data using gzip and stores it in the KV store.
- `getGzip`: Retrieves compressed data from the KV store without decompressing it.
- `getGunzip`: Retrieves compressed data from the KV store, decompresses it, and returns the original data.

### `useFS`

Based on `useStorage` and `usestorage`'s `fs` driver, to provide runtime-editable support for storing data on the filesystem.
It can also be combiled with `zlib` to provide gzip support as described above.

### `useS3` (optional)

Based on `useStorage` and `usestorage`'s `s3` driver, to provide runtime-editable support with any S3 compatible storages.
It can also be combiled with `zlib` to provide gzip support as described above.

### `useKV` (optional)

Based on `useStorage` and `usestorage`'s `redis` driver, to provide runtime-editable support with any Redis compatible KV stores.
It can also be combiled with `zlib` to provide gzip support as described above.

### `useZlib` (optional)

Mainly used internally for `useKV`, it currently only provides the following functions:

- `gzip`: Compresses data using gzip.
- `gunzip`: Decompresses gzip-compressed data.

## `cache` (optional)

There is built-in support to use `useMem` or `useKV` as a cache provider. You can switch between them by setting `lab.cache` to either `'mem'` or `'kv'` or disable it via `null` (default). This automatically configures Nuxt and Nitro for caching server-side requests and functions.

## Real-time Remote State Management (optional)

A WebSocket implementation with built-in shared state management, channel subscriptions, and type safety.

- 🔄 Automatic reconnection
- 📦 Built-in shared state management per channel
- 🔐 Type-safe messages and channels
- 📢 Hooking system to trigger global or per-channel messages
- 💾 Easily add persistent storage with `useMem` or `useKV`

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
  pnpm install
  
  # Generate type stubs
  pnpm run dev:prepare
  
  # Develop with the playground
  pnpm run dev
  
  # Build the playground
  pnpm run dev:build
  
  # Run ESLint
  pnpm run lint
  
  # Run Vitest
  pnpm run test
  pnpm run test:watch
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
