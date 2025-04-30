import { normalizeKey as nK } from 'unstorage'
import { withLeadingSlash, withoutLeadingSlash } from 'ufo'

type StaticContentFileType = 'json' | 'toml' | 'yaml' | 'markdown' | 'unknown'
interface StaticContentFileBase {
  /**
   * The path to the file, relative to the CMS root.
   * @example `blog/1.md`
   */
  file: string
  /**
   * The normalized path of the file without the file extension.
   * It is derived from the `file` property and is used to identify the file via `queryStaticContent` utility.
   * @example `/blog/1`
   */
  path: string
  /**
   * The directory containing the file, derived from the `file` property.
   * @example `/blog`
   */
  dir: string
  env?: 'dev' | 'demo' | undefined
}
type StaticContentFileExt = {
  /**
   * The file extension of the path.
   * @example `.md`
   */
  ext?: undefined
  /**
   * The file type, if supported, used to determine how to parse the file.
   * @example `markdown`
   */
  type?: undefined
} | {
  /**
   * The file extension of the path.
   * @example `.md`
   */
  ext: string
  /**
   * The file type, if supported, used to determine how to parse the file.
   * @example `markdown`
   */
  type: StaticContentFileType
}
export type StaticContentFile = StaticContentFileBase & StaticContentFileExt

export function normalizeKey(key: string): string {
  return nK(key)
}
export function denormalizeKey(key: string): string {
  return key.replace(/:/g, '/')
}

function parseExt(ext?: string): StaticContentFileExt {
  if (!ext) return { ext: undefined, type: undefined }

  let type: StaticContentFileType | undefined = undefined

  switch (ext) {
    case '.json':
      type = 'json'
      break
    case '.toml':
    case '.tml':
      type = 'toml'
      break
    case '.yaml':
    case '.yml':
      type = 'yaml'
      break
    case '.mdc':
    case '.md':
      type = 'markdown'
      break
    default:
      type = 'unknown'
      break
  }

  return {
    ext,
    type,
  }
}

function parsePath(path: string) {
  if (path === 'index' || path === '/index') return '/'

  return withLeadingSlash(path.replace(/\/index$/, ''))
}

/**
 * Fork of UnJS pathe
 *
 * source: https://github.com/unjs/pathe
 * License: MIT
 */

const _DRIVE_LETTER_START_RE = /^[a-z]:\//i

// It captures:
// 1. `basePath`: The main part of the path before optional env/ext
// 2. `env`: Optional environment (.dev or .demo)
// 3. `ext`: Optional extension
const _PATH_PARTS_RE = /^(?<basePath>.+?)(?:\.(?<env>dev|demo))?(?<ext>\.[^./\s]+)?$/

export function parseFile(file: string): StaticContentFile {
  if (!file) {
    throw new Error('File path is required for parsing')
  }

  const normalizedFile = normalizeWindowsPath(file)
  const { basePath, env, ext } = _PATH_PARTS_RE.exec(normalizedFile)?.groups as { basePath: string, env?: 'dev' | 'demo', ext?: string }
  const parsedBasePath = parsePath(basePath)

  return {
    file: withoutLeadingSlash(file),
    path: parsedBasePath,
    dir: withLeadingSlash(
      parsedBasePath
        .replace(/\/$/, '')
        .split('/')
        .slice(0, -1)
        .join('/'),
    ),
    env,
    ...parseExt(ext),
  }
}

// Util to normalize windows paths to posix
export function normalizeWindowsPath(input = '') {
  if (!input) {
    return input
  }
  return input
    .replace(/\\/g, '/')
    .replace(_DRIVE_LETTER_START_RE, r => r.toUpperCase())
}
