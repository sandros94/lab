import { readdirSync, existsSync } from 'node:fs'
import { extname, relative, join } from 'pathe'
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

export interface CMSModuleOptions {
  dir?: string
  addRoute?: boolean
  prerender?: boolean
}
export interface CMSParsedFile {
  file?: string
  path?: string
}

export function addCMSModule(nuxt: Nuxt, options?: CMSModuleOptions) {
  const defOptions = defu(options, { dir: 'cms', addRoute: true, prerender: true })
  const { resolve } = createResolver(import.meta.url)

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

  const parsedFiles: CMSParsedFile[] = []
  if (defOptions.prerender) {
    nuxt.options.routeRules ||= {}
    scanDirectory(path)
    nuxt.callHook('lab:cms:parsedFiles', parsedFiles)
  }

  // Utility function to scan cms directory
  function scanDirectory(dirPath: string, basePath: string = ''): void {
    if (!existsSync(dirPath)) {
      logger.error(`CMS directory not found!\nPlease create a directory \`"${defOptions.dir}"\` in your project root folder.`)
      return
    }
    const files = readdirSync(dirPath, { withFileTypes: true })

    for (const item of files) {
      const itemPath = join(dirPath, item.name)
      const relativePath = join(basePath, item.name)

      if (item.isDirectory()) {
        // Recursively scan subdirectory
        scanDirectory(itemPath, relativePath)
      }
      else {
        const parsedFile: CMSParsedFile = {}
        const ext = extname(item.name)
        const cmsPath = join('/_cms', relativePath)

        if (ext) {
          const cmsPathWithoutExt = cmsPath.replace(ext, '')
          nuxt.options.routeRules![cmsPathWithoutExt] = { prerender: true }
          parsedFile.path = cmsPathWithoutExt
        }

        nuxt.options.routeRules![cmsPath] = { prerender: true }
        parsedFile.file = cmsPath

        parsedFiles.push(parsedFile)
      }
    }
  }
}
