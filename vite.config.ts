import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { nitro } from 'nitro/vite'
import type { Plugin } from 'vite-plus'
// @ts-expect-error local config-time generator script is loaded via ESM
import { generatePageRoutes } from './scripts/generate-page-routes.mjs'
import { defineConfig } from 'vite-plus'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const routesDir = path.resolve(dirname, './src/routes')
const isVitest = process.env.VITEST === 'true'
const useNitro = !isVitest
const isProductionBuild = process.argv.includes('build') && !isVitest
// Nitro owns HTTP routing in both dev and prod. Keep the RSC and SSR environments on the
// development runtime unless we are doing a production build.
const nodeEnv = JSON.stringify(isProductionBuild ? 'production' : 'development')

await generatePageRoutes()

function pageRoutesManifestPlugin(): Plugin {
  let queuedRun = Promise.resolve()

  function enqueueGeneration(onChanged?: () => void) {
    queuedRun = queuedRun.then(async () => {
      const result = await generatePageRoutes()
      if (result.changed) {
        onChanged?.()
      }
    })

    return queuedRun
  }

  function isRoutePageFile(file: string) {
    const resolvedFile = path.resolve(file)
    return (
      path.basename(resolvedFile) === 'page.tsx' &&
      (resolvedFile === path.join(routesDir, 'page.tsx') ||
        resolvedFile.startsWith(`${routesDir}${path.sep}`))
    )
  }

  return {
    apply: 'serve',
    name: 'page-routes-manifest',
    async configureServer(server) {
      await enqueueGeneration()

      const rerender = () => {
        server.ws.send({ type: 'full-reload' })
      }

      const onAdd = (file: string) => {
        if (!isRoutePageFile(file)) {
          return
        }

        void enqueueGeneration(rerender)
      }
      const onUnlink = (file: string) => {
        if (!isRoutePageFile(file)) {
          return
        }

        void enqueueGeneration(rerender)
      }

      server.watcher.on('add', onAdd)
      server.watcher.on('unlink', onUnlink)

      return () => {
        server.watcher.off('add', onAdd)
        server.watcher.off('unlink', onUnlink)
      }
    }
  }
}

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  test: {
    includeSource: ['src/**/*.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@server': path.resolve(dirname, './server')
    }
  },
  plugins: [
    ...(useNitro ? [nitro()] : []),
    pageRoutesManifestPlugin(),
    tailwindcss(),
    rsc({
      serverHandler: false
    }),

    // use any of react plugins https://github.com/vitejs/vite-plugin-react
    // to enable client component HMR
    react()

    // use https://github.com/antfu-collective/vite-plugin-inspect
    // to understand internal transforms required for RSC.
    // import("vite-plugin-inspect").then(m => m.default()),
  ],

  // specify entry point for each environment.
  // (currently the plugin assumes `rolldownOptions.input.index` for some features.)
  environments: {
    // `rsc` environment loads modules with `react-server` condition.
    // this environment is responsible for:
    // - RSC stream serialization (React VDOM -> RSC stream)
    // - server functions handling
    rsc: {
      define: {
        'process.env.NODE_ENV': nodeEnv
      },
      build: {
        minify: true,
        rolldownOptions: {
          input: {
            index: './src/framework/entry.rsc.tsx'
          }
        }
      }
    },

    // `ssr` environment loads modules without `react-server` condition.
    // this environment is responsible for:
    // - RSC stream deserialization (RSC stream -> React VDOM)
    // - traditional SSR (React VDOM -> HTML string/stream)
    ssr: {
      define: {
        'process.env.NODE_ENV': nodeEnv
      },
      build: {
        minify: true,
        rolldownOptions: {
          input: {
            index: './src/framework/entry.ssr.tsx'
          },
          plugins: [
            {
              name: 'remove-legacy-server-renderer',
              load(id) {
                if (id.includes('react-dom-server-legacy.browser.production')) {
                  return 'module.exports = {};'
                }
              }
            }
          ]
        }
      }
    },

    // client environment is used for hydration and client-side rendering
    // this environment is responsible for:
    // - RSC stream deserialization (RSC stream -> React VDOM)
    // - traditional CSR (React VDOM -> Browser DOM tree mount/hydration)
    // - refetch and re-render RSC
    // - calling server functions
    client: {
      build: {
        rolldownOptions: {
          input: {
            index: './src/framework/entry.browser.tsx'
          }
        }
      }
    }
  }
})
