import { normalizeKey } from 'unstorage'
import { parseTOML, parseYAML } from 'confbox'
import type { GetKeysOptions, StorageValue } from 'unstorage'
import type { MDCParserResult } from '@nuxtjs/mdc'

import {
  type ParseExtReturn,
  fileExt,
  parseExt,
} from './internal'

// @ts-expect-error `parseMarkdown` is imported from @nuxtjs/mdc
import { parseMarkdown, useStorage } from '#imports'

export type { ParseExtReturn }
export type StaticContent<T = unknown> = Omit<ParseExtReturn, 'type'> & ({
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
  type: 'unknown' | 'raw'
  content: null | (T extends unknown ? StorageValue : T)
})

/**
 * Retrieves and parses static content from the CMS assets storage.
 *
 * @param path - The path to the content file, with or without extension
 * @param base - Optional base directory to scope the search
 * @param opts - Optional configuration options for storage key retrieval
 * @typeParam T - The expected return type of the content
 *
 * @returns A promise resolving to a `StaticContent` object containing:
 *   - `file`: Original file path
 *   - `type`: Content type ('json', 'toml', 'yaml', 'markdown', or 'unknown' | 'raw')
 *   - `content`: The parsed content based on the file type, or null if not found
 *   - `env`: Optional deployment target ('dev', 'demo', or undefined)
 *   - `path`: The file path without extension
 *   - `ext`: The file extension
 *
 * @example
 * // With extension
 * const article = await queryStaticContent<Article>('blog/my-post.md');
 *
 * @example
 * // Without extension (will find the first matching file)
 * const config = await queryStaticContent('settings/config');
 *
 * @example
 * // With base directory
 * const posts = await queryStaticContent('latest', 'blog');
 */
export async function queryStaticContent<T>(path: string, base?: string, opts?: GetKeysOptions): Promise<StaticContent<T> | undefined> {
  if (!path) return undefined

  const storage = useStaticContent()
  const files = await storage.getKeys(base, opts)
  const requestWithExt = !!fileExt(path).ext
  const _path = normalizeKey(path)

  for (const fileKey of files) {
    if (requestWithExt && fileKey === _path) {
      return {
        ...parseExt(fileKey),
        type: 'raw' as const,
        content: await storage.getItem(fileKey) as T extends unknown ? StorageValue : T,
      }
    }
    else if (!requestWithExt) {
      const p = parseExt(fileKey)
      if (p.path === _path) {
        return parseFile<T>(fileKey, p)
      }
    }
  }

  async function parseFile<T>(fileKey: string, match: ParseExtReturn): Promise<StaticContent<T>> {
    switch (match.type) {
      case 'json': {
        const data = await storage.getItem<string>(fileKey)
        return {
          ...match,
          type: 'json' as const,
          content: data !== null
            ? JSON.parse(data) as T extends unknown ? Record<string, any> : T
            : null,
        }
      }
      case 'toml': {
        const data = await storage.getItem<string>(fileKey)
        return {
          ...match,
          type: 'toml' as const,
          content: data !== null
            ? parseTOML<T extends unknown ? Record<string, any> : T>(data)
            : null,
        }
      }
      case 'yaml': {
        const data = await storage.getItem<string>(fileKey)
        return {
          ...match,
          type: 'yaml' as const,
          content: data !== null
            ? parseYAML<T extends unknown ? Record<string, any> : T>(data)
            : null,
        }
      }
      case 'markdown': {
        const data = await storage.getItem<string>(fileKey)
        return {
          ...match,
          type: 'markdown' as const,
          content: data !== null
            ? await parseMarkdown(data)
            : null,
        }
      }
      // TODO: Add support for other file types
      default:
        return {
          ...match,
          type: 'unknown' as const,
          content: await storage.getItem(fileKey) as T extends unknown ? StorageValue : T,
        }
    }
  }
}

/**
 * Lists all static content files in the CMS assets storage with parsed metadata.
 *
 * @param base - Optional base directory to scope the search
 * @param opts - Optional configuration options for storage key retrieval
 *
 * @returns A promise resolving to an array of `ParseExtReturn` objects containing:
 *   - `file`: Original file path
 *   - `type`: Content type ('json', 'toml', 'yaml', 'markdown', or 'unknown')
 *   - `env`: Optional deployment target ('dev', 'demo', or undefined)
 *   - `path`: The normalized file path without extension
 *   - `ext`: The file extension
 *
 * @example
 * // List all content files
 * const allFiles = await listStaticContent();
 *
 * @example
 * // List content files in specific directory
 * const blogPosts = await listStaticContent('blog');
 */
export async function listStaticContent(base?: string, opts?: GetKeysOptions): Promise<ParseExtReturn[]> {
  const files = await useStaticContent().getKeys(base, opts)

  return files.map((file) => {
    return parseExt(file)
  })
}

/**
 * Provides access to the CMS assets storage driver.
 *
 * @returns A storage driver instance for the 'assets:cms' namespace
 *
 * @example
 * // Get the storage driver
 * const storage = useStaticContent();
 *
 * @example
 * // Use the storage driver to get content directly
 * const rawContent = await useStaticContent().getItem('blog:post.md');
 */
export function useStaticContent() {
  return useStorage('assets:cms')
}
