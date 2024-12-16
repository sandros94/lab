import type { NitroRuntimeHooks } from 'nitropack/types'
import type { HookCallback, HookKeys } from 'hookable'

import { useNitroApp } from '#imports'

type InferCallback<HT, HN extends keyof HT> = HT[HN] extends HookCallback ? HT[HN] : never

export function useNitroHooks() {
  const nitroApp = useNitroApp()

  function hookSync<HN extends HookKeys<NitroRuntimeHooks>>(hookName: HN, ...param: Parameters<InferCallback<NitroRuntimeHooks, HN>>) {
    const results = nitroApp.hooks.callHookWith(hooks => hooks.map(hook => hook(param)), hookName, ...param)
    if (import.meta.dev && results && results.some(i => i && 'then' in i)) {
      console.error(`[lab] Error in \`${hookName}\` hook. Callback must be synchronous.`)
    }
  }

  return {
    hookSync,
    hook: nitroApp.hooks.hook,
    hookOnce: nitroApp.hooks.hookOnce,
  }
}
