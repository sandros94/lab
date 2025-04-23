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
import { logger } from '../runtime/utils'
import {
  type StaticContentFile,
  normalizeWindowsPath,
  parseFile,
} from './runtime/internal'

export interface CMSModuleOptions {
  dir?: string
  addRoutes?: boolean
  prerender?: boolean
}

export function addCMSModule(nuxt: Nuxt, options?: CMSModuleOptions) {
  const defOptions = defu(options, { dir: 'cms', addRoutes: true, prerender: true })
  const { resolve } = createResolver(import.meta.url)

  nuxt.options.alias['#lab/cms'] = resolve('./runtime/server/utils')

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
      from: resolve('./runtime/server/utils'),
    },
    {
      name: 'listStaticContent',
      from: resolve('./runtime/server/utils'),
    },
    {
      name: 'useStaticContent',
      from: resolve('./runtime/server/utils'),
    },
  ])
  if (defOptions.addRoutes) {
    addServerHandler({
      route: '/_cms',
      method: 'get',
      handler: resolve('./runtime/server/routes/index'),
    })
    addServerHandler({
      route: '/_cms/**',
      method: 'get',
      handler: resolve('./runtime/server/routes/nested'),
    })
  }

  const scannedFiles = scanCMSDirectory(nuxt, path)

  if (defOptions.addRoutes && defOptions.prerender && scannedFiles.length) {
    nuxt.options.routeRules ||= {}
    const prerenderedRoutes: string[] = []

    for (const file of scannedFiles) {
      if (file.env === 'dev' && !nuxt.options.dev) continue

      if (file.type !== undefined && file.type !== 'unknown') {
        if (prerenderedRoutes.includes(file.path)) continue

        nuxt.options.routeRules[join('/_cms', file.path)] = {
          prerender: true,
        }
        prerenderedRoutes.push(file.path)
      }

      nuxt.options.routeRules[join('/_cms', file.file)] = {
        prerender: true,
      }
    }
  }
}

function scanCMSDirectory(nuxt: Nuxt, path: string): StaticContentFile[] {
  if (!existsSync(path)) {
    logger.error(`CMS directory not found!\nPlease create a directory \`"${relative(nuxt.options.rootDir, path)}"\` in your project root folder.`)
    return []
  }

  const scannedFiles: StaticContentFile[] = []
  const files = readdirSync(path, { withFileTypes: true, recursive: true })

  for (const _file of files) {
    if (_file.isDirectory()) continue
    const parent = normalizeWindowsPath(_file.parentPath)
    const file = relative(path, join(parent, normalizeWindowsPath(_file.name)))

    const parsedFile = parseFile(file)
    scannedFiles.push(parsedFile)
  }

  nuxt.callHook('lab:cms:scannedFiles', scannedFiles, nuxt)
  return scannedFiles
}
