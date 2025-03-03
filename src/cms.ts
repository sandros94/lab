import { readdirSync } from 'node:fs'
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

export interface CMSModuleOptions {
  dir?: string
  addRoute?: boolean
}
export interface CMSParsedFile {
  file?: string
  path?: string
}

export function addCMSModule(nuxt: Nuxt, options?: CMSModuleOptions) {
  const defOptions = defu(options, { dir: 'cms', addRoute: true })
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

  addServerImports([{
    name: 'queryStaticContent',
    from: resolve('./runtime/cms/utils'),
  }])
  if (defOptions.addRoute)
    addServerHandler({
      route: '/_cms/**',
      method: 'get',
      handler: resolve('./runtime/cms/routes'),
    })

  nuxt.options.routeRules ||= {}
  const files = readdirSync(path)
  const parsedFiles: CMSParsedFile[] = []
  for (const file of files) {
    const parsedFile: CMSParsedFile = {}
    const ext = extname(file)
    if (ext) {
      nuxt.options.routeRules[join('/_cms', file.replace(ext, ''))] = { prerender: true }
      parsedFile.path = join('/_cms', file.replace(ext, ''))
    }
    nuxt.options.routeRules[join('/_cms', file)] = { prerender: true }
    parsedFile.file = join('/_cms', file)

    parsedFiles.push(parsedFile)
  }

  nuxt.callHook('lab:cms:parsedFiles', parsedFiles)
}
