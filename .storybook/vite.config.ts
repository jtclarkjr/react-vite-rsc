import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, '../src')
    }
  }
})
