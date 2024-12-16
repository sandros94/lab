import type { NitroRuntimeHooks } from 'nitropack/types'
import type { HookCallback, HookKeys } from 'hookable'

import { useNitroApp } from '#imports'

type InferCallback<HT, HN extends keyof HT> = HT[HN] extends HookCallback ? HT[HN] : never

export function useNitroHooks() {
  const { hooks } = useNitroApp()

  function callHookSync<HN extends HookKeys<NitroRuntimeHooks>>(hookName: HN, ...param: Parameters<InferCallback<NitroRuntimeHooks, HN>>) {
    const results = hooks.callHookWith(hooks => hooks.map(hook => hook(param)), hookName, ...param)
    if (import.meta.dev && results && results.some(i => i && 'then' in i)) {
      console.error(`[lab] Error in \`${hookName}\` hook. Callback must be synchronous.`)
    }
  }

  return {
    callHookSync,
    hook: hooks.hook,
    hookOnce: hooks.hookOnce,
    afterEach: hooks.afterEach,
    beforeEach: hooks.beforeEach,
    callHook: hooks.callHook,
    callHookParallel: hooks.callHookParallel,
  }
}
