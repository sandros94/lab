import { extname } from 'pathe'
import { normalizeKey } from 'unstorage'
import { parseTOML, parseYAML } from 'confbox'
import type { MDCParserResult } from '@nuxtjs/mdc'

import { parseMarkdown, useStorage } from '#imports'

export type StaticContentReturn<T = unknown> = {
  type: 'json'
  content: null | (T extends unknown ? Record<string, any> : T)
} | {
  type: 'toml'
  content: null | (T extends unknown ? Record<string, any> : T)
} | {
  type: 'yaml'
  content: null | (T extends unknown ? Record<string, any> : T)
} | {
  type: 'markdown'
  content: null | MDCParserResult
} | {
  type: 'unknown'
  content: null | T
}

/**
 * Retrieves and parses static content from the CMS assets storage.
 *
 * @param path - The path to the content file, with or without extension
 * @typeParam T - The expected return type of the content
 *
 * @returns A promise resolving to an object containing:
 *   - `type`: The content type ('json', 'toml', 'yaml', 'markdown', or 'unknown')
 *   - `content`: The parsed content based on the file type, or null if not found
 *
 * @example
 * // With extension
 * const article = await queryStaticContent<Article>('blog/my-post.md');
 *
 * @example
 * // Without extension (will find the first matching file)
 * const config = await queryStaticContent('settings/config');
 */
export async function queryStaticContent<T>(path: string) {
  const storage = useStorage(`assets:cms`)
  const files = await storage.getKeys()
  const requestWithExt = !!extname(path)
  const _path = normalizeKey(path)

  for (const fileKey of files) {
    if (requestWithExt && fileKey === _path) {
      let ext = extname(fileKey)
      switch (ext) {
        case '.json':
          ext = 'json'
          break
        case '.toml':
        case '.tml':
          ext = 'toml'
          break
        case '.yaml':
        case '.yml':
          ext = 'yaml'
          break
        case '.mdc':
        case '.md':
          ext = 'markdown'
          break
        default:
          break
      }
      return {
        type: ext,
        content: await storage.getItem<T>(fileKey),
      }
    }
    else if (!requestWithExt) {
      const p = fileExt(fileKey)
      if (p?.path === _path) {
        return parseFile<T>(fileKey, p.ext)
      }
    }
  }

  async function parseFile<T = unknown>(fileKey: string, ext: string): Promise<StaticContentReturn<T>> {
    switch (ext) {
      case '.json': {
        const data = await storage.getItem<string>(fileKey)
        return {
          type: 'json' as const,
          content: data !== null
            ? JSON.parse(data) as T extends unknown ? Record<string, any> : T
            : null,
        }
      }
      case '.toml':
      case '.tml': {
        const data = await storage.getItem<string>(fileKey)
        return {
          type: 'toml' as const,
          content: data !== null
            ? parseTOML<T extends unknown ? Record<string, any> : T>(data)
            : null,
        }
      }
      case '.yaml':
      case '.yml': {
        const data = await storage.getItem<string>(fileKey)
        return {
          type: 'yaml' as const,
          content: data !== null
            ? parseYAML<T extends unknown ? Record<string, any> : T>(data)
            : null,
        }
      }
      case '.mdc':
      case '.md': {
        const data = await storage.getItem<string>(fileKey)
        return {
          type: 'markdown' as const,
          content: data !== null
            ? await parseMarkdown(data)
            : null,
        }
      }
      // TODO: Add support for other file types
      default:
        return {
          type: 'unknown' as const,
          content: await storage.getItem<T>(fileKey),
        }
    }
  }
}

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//
const _EXTNAME_RE = /.(\.[^./]+|\.)$/

function fileExt(p: string) {
  if (p === '..') return undefined
  const match = _EXTNAME_RE.exec(normalizeWindowsPath(p))
  return (match && match[1])
    ? {
        path: p.slice(0, -match[1].length),
        ext: match[1],
      }
    : {
        path: p,
        ext: '',
      }
}

// Util to normalize windows paths to posix
function normalizeWindowsPath(input = '') {
  if (!input) {
    return input
  }
  return input
    .replace(/\\/g, '/')
    .replace(_DRIVE_LETTER_START_RE, r => r.toUpperCase())
}
