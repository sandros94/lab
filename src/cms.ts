import { readdirSync } from 'node:fs'
import { extname, relative, join } from 'pathe'
import type { Nuxt } from '@nuxt/schema'
import { defu } from 'defu'
import {
  addServerImports,
  addServerScanDir,
  createResolver,
  hasNuxtModule,
  installModule,
} from 'nuxt/kit'

export interface CMSModuleOptions {
  dir?: string
  addRoute?: boolean
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
    installModule('@nuxtjs/mdc', undefined, nuxt)
  }

  // TODO: understand why `addServerHandler` catch-all is not working
  if (defOptions.addRoute)
    addServerScanDir(resolve('./runtime/cms'))
  else
    addServerImports([{
      name: 'queryStaticContent',
      from: resolve('./runtime/cms/utils'),
    }])

  nuxt.options.routeRules ||= {}
  const files = readdirSync(path)
  for (const file of files) {
    const ext = extname(file)
    if (ext)
      nuxt.options.routeRules[`/_cms/${file.replace(ext, '')}`] = { prerender: true }
    nuxt.options.routeRules[`/_cms/${file}`] = { prerender: true }
  }
}
