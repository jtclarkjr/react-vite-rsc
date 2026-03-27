import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  test: {
    includeSource: ['src/**/*.{ts,tsx}']
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src')
    }
  },
  plugins: [
    tailwindcss(),
    rsc({
      // `entries` option is only a shorthand for specifying each `rolldownOptions.input` below
      // > entries: { rsc, ssr, client },
      //
      // by default, the plugin setup request handler based on `default export` of `rsc` environment `rolldownOptions.input.index`.
      // This can be disabled when setting up own server handler e.g. `@cloudflare/vite-plugin`.
      // > serverHandler: false
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
        'process.env.NODE_ENV': '"production"'
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
        'process.env.NODE_ENV': '"production"'
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
          },
          output: {
            codeSplitting: {
              groups: [
                {
                  name: 'vendor-react',
                  test: /[\\/]node_modules[\\/]react(-dom)?[\\/]/
                },
                {
                  name: 'shared-ui',
                  test: /tailwind-merge|clsx|src[\\/](lib[\\/]utils|components[\\/]ui[\\/])/
                },
                {
                  name: 'feature-blog',
                  test: /src[\\/]features[\\/]blog[\\/]/
                },
                {
                  name: 'feature-starter',
                  test: /src[\\/]features[\\/]starter[\\/]/
                },
                {
                  name: 'feature-protected',
                  test: /src[\\/]features[\\/]protected[\\/]/
                }
              ]
            }
          }
        }
      }
    }
  }
})
