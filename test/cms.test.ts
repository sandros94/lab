import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, it, expect } from 'vitest'

describe('cms', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  })

  it('Successfully fetch an index file', async () => {
    const data = await $fetch('/_cms')

    expect(data).toMatchInlineSnapshot(`
      {
        "content": {
          "body": {
            "children": [
              {
                "children": [
                  {
                    "type": "text",
                    "value": "Home page",
                  },
                ],
                "props": {
                  "id": "home-page",
                },
                "tag": "h1",
                "type": "element",
              },
              {
                "children": [
                  {
                    "type": "text",
                    "value": "welcome",
                  },
                ],
                "props": {},
                "tag": "p",
                "type": "element",
              },
              {
                "children": [
                  {
                    "children": [
                      {
                        "type": "text",
                        "value": "test page",
                      },
                    ],
                    "props": {
                      "href": "/cms/test",
                    },
                    "tag": "a",
                    "type": "element",
                  },
                ],
                "props": {},
                "tag": "p",
                "type": "element",
              },
            ],
            "type": "root",
          },
          "data": {
            "description": "welcome",
            "title": "Home page",
          },
          "toc": {
            "depth": 2,
            "links": [],
            "searchDepth": 2,
            "title": "",
          },
        },
        "dir": "/",
        "ext": ".md",
        "file": "index.md",
        "path": "/",
        "type": "markdown",
      }
    `)
  })

  it('Successfully fetch a nested index file', async () => {
    const data = await $fetch('/_cms/nested')

    expect(data).toMatchInlineSnapshot(`
      {
        "content": {
          "body": {
            "children": [
              {
                "children": [
                  {
                    "type": "text",
                    "value": "nested index",
                  },
                ],
                "props": {},
                "tag": "p",
                "type": "element",
              },
            ],
            "type": "root",
          },
          "data": {
            "description": "nested index",
            "title": "",
          },
          "toc": {
            "depth": 2,
            "links": [],
            "searchDepth": 2,
            "title": "",
          },
        },
        "dir": "/",
        "ext": ".md",
        "file": "nested/index.md",
        "path": "/nested",
        "type": "markdown",
      }
    `)
  })

  it('Successfully fetch parsed yaml', async () => {
    const data = await $fetch(`/_cms/test`)

    expect(data).toStrictEqual({
      dir: '/',
      ext: '.yaml',
      file: 'test.yaml',
      path: '/test',
      type: 'yaml',
      content: {
        services: {
          first: {
            class: 'FirstService',
            arguments: [
              '@second',
              '@third',
            ],
          },
          second: {
            class: 'SecondService',
            arguments: [
              '@fourth',
              '@fifth',
            ],
          },
        },
      },
    })
  })

  it('Successfully fetch raw yaml', async () => {
    const data = await $fetch(`/_cms/test.yaml`)

    expect(data).toMatchInlineSnapshot(`
      {
        "content": "services:
        first:
          class: FirstService
          arguments:
            - '@second'
            - '@third'
        second:
          class: SecondService
          arguments:
            - '@fourth'
            - '@fifth'
      ",
        "dir": "/",
        "ext": ".yaml",
        "file": "test.yaml",
        "path": "/test",
        "type": "raw",
      }
    `)
  })
})
