import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineNitroConfig } from 'nitro/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineNitroConfig({
  alias: {
    '@server': path.resolve(dirname, './server')
  },
  preset: 'node_server',
  serverDir: './server',
  renderer: {
    handler: './server/renderer.ts'
  },
  routeRules: {
    '/_actions/**': {
      headers: {
        'cache-control': 'no-store'
      }
    },
    '/_rsc/**': {
      headers: {
        'cache-control': 'no-store'
      }
    }
  }
})
