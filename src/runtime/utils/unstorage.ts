/**
 * From `unjs/unstorage` implementation
 * https://github.com/unjs/unstorage/blob/6163be0eb5035b54f3a576086e7b41a48efa3607/src/_utils.ts
 */
export const BASE64_PREFIX = 'base64:'

export function checkBufferSupport() {
  if (typeof Buffer === 'undefined') {
    throw new TypeError('[unstorage] Buffer is not supported!')
  }
}

export function serializeRaw(value: any) {
  if (typeof value === 'string') {
    return value
  }
  checkBufferSupport()
  const base64 = Buffer.from(value).toString('base64')
  return BASE64_PREFIX + base64
}

export function deserializeRaw(value: any): Buffer | string {
  if (typeof value !== 'string') {
    // Return non-strings as-is
    return value
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    // Return unknown strings as-is
    return value
  }
  checkBufferSupport()
  return Buffer.from(value.slice(BASE64_PREFIX.length), 'base64')
}
