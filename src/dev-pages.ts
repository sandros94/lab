import type { Nuxt } from '@nuxt/schema'
import { logger } from './runtime/utils'

export function addDevPagesModule(nuxt: Nuxt) {
  if (nuxt.options.dev) {
    nuxt.hook('pages:extend', (pages) => {
      logger.log('Pages:', pages)
      pages.forEach((page) => {
        if (page.path.endsWith('.dev')) {
          page.path = page.path.replace('.dev', '')
          page.name = page.name?.replace('.dev', '')
        }
        else if (page.path.endsWith('.demo')) {
          page.path = page.path.replace('.demo', '')
          page.name = page.name?.replace('.demo', '')
        }
      })
    })
  }
  else {
    logger.info('Building for production, ignoring `dev` pages')
    nuxt.options.ignore.push('~/pages/**.dev.{js,cts,mts,ts,jsx,tsx,vue}')

    if (import.meta.env.DEPLOYMENT !== 'production') {
      nuxt.hook('pages:extend', (pages) => {
        pages.forEach((page) => {
          if (page.path.endsWith('.demo')) {
            page.path = page.path.replace('.demo', '')
            page.name = page.name?.replace('.demo', '')
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
