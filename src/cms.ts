import { readdirSync, existsSync } from 'node:fs'
import { relative, join } from 'pathe'
import type { Nuxt } from '@nuxt/schema'
import { defu } from 'defu'
import {
  addServerImports,
  addServerHandler,
  createResolver,
  hasNuxtModule,
  installModule,
} from '@nuxt/kit'
import { logger } from './runtime/utils'
import {
  type ParseExtReturn,
  normalizeWindowsPath,
  parseExt,
} from './runtime/cms/internal'

export interface CMSModuleOptions {
  dir?: string
  addRoute?: boolean
  prerender?: boolean
}

export function addCMSModule(nuxt: Nuxt, options?: CMSModuleOptions) {
  const defOptions = defu(options, { dir: 'cms', addRoute: true, prerender: true })
  const { resolve } = createResolver(import.meta.url)

  nuxt.options.alias['#lab/cms'] = resolve('./runtime/cms/utils')

  const path = join(nuxt.options.rootDir, defOptions.dir)
  nuxt.options.nitro.serverAssets ||= []
  nuxt.options.nitro.serverAssets.push({
    baseName: 'cms',
    dir: join(relative(nuxt.options.serverDir, nuxt.options.rootDir), defOptions.dir),
  })

  // TODO: make this optional (removing the ability to parse markdown)
  if (!hasNuxtModule('@nuxtjs/mdc', nuxt) || !hasNuxtModule('@nuxt/content', nuxt)) {
    installModule('@nuxtjs/mdc')
  }

  addServerImports([
    {
      name: 'queryStaticContent',
      from: resolve('./runtime/cms/utils'),
    },
    {
      name: 'listStaticContent',
      from: resolve('./runtime/cms/utils'),
    },
    {
      name: 'useStaticContent',
      from: resolve('./runtime/cms/utils'),
    },
  ])
  if (defOptions.addRoute)
    addServerHandler({
      route: '/_cms/**',
      method: 'get',
      handler: resolve('./runtime/cms/routes'),
    })

  const scannedFiles = scanCMSDirectory(nuxt, path)

  if (defOptions.addRoute && defOptions.prerender && scannedFiles) {
    nuxt.options.routeRules ||= {}
    for (const [file, parsed] of scannedFiles) {
      if (parsed.env === 'dev' && !nuxt.options.dev) continue

      if (parsed.type !== 'unknown') {
        nuxt.options.routeRules[`/_cms/${parsed.path}`] = {
          prerender: true,
        }
      }

      nuxt.options.routeRules[`/_cms/${file}`] = {
        prerender: true,
      }
    }
  }
}

function scanCMSDirectory(nuxt: Nuxt, path: string): Map<string, ParseExtReturn> | undefined {
  if (!existsSync(path)) {
    logger.error(`CMS directory not found!\nPlease create a directory \`"${relative(nuxt.options.rootDir, path)}"\` in your project root folder.`)
    return undefined
  }

  const scannedFiles: Map<string, ParseExtReturn> = new Map()
  const files = readdirSync(path, { withFileTypes: true, recursive: true })

  for (const _file of files) {
    if (_file.isDirectory()) continue
    const parent = normalizeWindowsPath(_file.parentPath)
    const file = relative(path, join(parent, normalizeWindowsPath(_file.name)))

    const parsedFile = parseExt(file)
    scannedFiles.set(file, parsedFile)
  }

  nuxt.callHook('lab:cms:scannedFiles', Object.fromEntries(scannedFiles), nuxt)
  return scannedFiles
}
