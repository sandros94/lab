import type { Ref, MaybeRef } from 'vue'
import { isRef, watch, useState } from '#imports'

// Type helper for state object with specific value types per key
export type MultiState<T extends Record<string, any>> = {
  [K in keyof T]: Ref<T[K] | undefined>
}

/**
 * Create multiple global reactive refs that will be hydrated but not shared across ssr requests
 *
 * @template T - Type of the channel data mapping
 * @param {MaybeRef<Array<keyof T | string>>} [keys] - Array of keys matching the generic type object
 * @param {object} [options] - Configuration options
 * @param {string} [options.prefix] - Prefix for state keys
 * @returns {MultiState<T>} Object containing reactive states for each key
 */
export function useMultiState<T extends Record<string, any>>(
  keys: MaybeRef<Array<keyof T>>,
  options?: {
    prefix?: string
  },
): MultiState<T> {
  const states = {} as MultiState<T>

  if (isRef(keys)) {
    watch(keys, (newKeys) => {
      getStates(states, newKeys, options?.prefix)
    }, { immediate: true })
  }
  else {
    getStates(states, keys, options?.prefix)
  }

  return states
}

function getStates<T extends Record<string, any>>(states: MultiState<T>, keys: Array<keyof T>, prefix?: string) {
  for (const key of keys) {
    if (!key || typeof key !== 'string') {
      throw new TypeError('[useMultiState] key must be a string: ' + String(key))
    }

    states[key as keyof T] = useState<T[typeof key] | undefined>(
      prefix
        ? `${prefix}-${String(key)}`
        : String(key),
      () => undefined,
    )
  }
}
