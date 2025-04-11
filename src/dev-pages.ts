import type { Nuxt } from '@nuxt/schema'
import { logger } from './runtime/utils'

export interface DevPagesModuleOptions {
  env?: string | undefined
  isPreview?: boolean
}

export function addDevPagesModule(nuxt: Nuxt, options?: DevPagesModuleOptions) {
  if (nuxt.options.dev) {
    nuxt.hook('pages:extend', (pages) => {
      pages.forEach((page) => {
        if (page.path.endsWith('.dev')) {
          page.path = page.path.replace('.dev', '').replace(/\/index$/, '')
          page.name = page.name?.replace('.dev', '').replace(/-index$/, '')
        }
        else if (page.path.endsWith('.demo')) {
          page.path = page.path.replace('.demo', '').replace(/\/index$/, '')
          page.name = page.name?.replace('.demo', '').replace(/-index$/, '')
        }
      })
    })
  }
  else {
    logger.info('Building for production, ignoring `dev` pages')
    nuxt.options.ignore.push('~/pages/**.dev.{js,cts,mts,ts,jsx,tsx,vue}')

    if (options?.isPreview || (options?.env !== 'production')) {
      nuxt.hook('pages:extend', (pages) => {
        pages.forEach((page) => {
          if (page.path.endsWith('.demo')) {
            page.path = page.path.replace('.demo', '').replace(/\/index$/, '')
            page.name = page.name?.replace('.demo', '').replace(/-index$/, '')
          }
        })
      })
    }
    else {
      logger.info('Building for production, ignoring `demo` pages')
      nuxt.options.ignore.push('~/pages/**.demo.{js,cts,mts,ts,jsx,tsx,vue}')
    }
  }
}
