export interface ParseExtReturn {
  file: string | undefined
  type: 'json' | 'toml' | 'yaml' | 'markdown' | 'unknown'
  env?: 'dev' | 'demo' | undefined
  path?: string | undefined
  ext?: string | undefined
}

export function parseExt(p: string): ParseExtReturn {
  const match = fileExt(p)
  let type: 'json' | 'toml' | 'yaml' | 'markdown' | 'unknown'
  switch (match.ext) {
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
    ...match,
    type,
  }
}

/**
 * Fork of UnJS pathe
 *
 * source: https://github.com/unjs/pathe
 * License: MIT
 */

const _DRIVE_LETTER_START_RE = /^[a-z]:\//i
const _EXTNAME_RE = /^(?<path>.*?)(?:\.(?<env>dev|demo))?(?<ext>\.[^./]+)?$/

export function fileExt(file: string) {
  if (file === '..') return { file: undefined }
  const match = _EXTNAME_RE.exec(normalizeWindowsPath(file))
  return (match && match.groups)
    ? {
        file,
        env: match.groups.env as 'dev' | 'demo' | undefined,
        path: match.groups.path,
        ext: match.groups.ext,
      }
    : {
        file,
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
