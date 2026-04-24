import tailwindcss from '@tailwindcss/vite'
import tsrxReact from '@tsrx/vite-plugin-react'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite-plus'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const isVitest = process.env.VITEST === 'true'
const useNitro = !isVitest
const isProductionBuild = process.argv.includes('build') && !isVitest
// Nitro owns HTTP routing in both dev and prod. Keep the RSC and SSR environments on the
// development runtime unless we are doing a production build.
const nodeEnv = JSON.stringify(isProductionBuild ? 'production' : 'development')

export default defineConfig({
  staged: {
    '*.{js,jsx,ts,tsx,mjs,cjs}': 'vp check --fix'
  },
  lint: {
    rules: {
      'no-nested-ternary': 'error'
    },
    options: { typeAware: true, typeCheck: true }
  },
  fmt: {
    semi: false,
    tabWidth: 2,
    singleQuote: true,
    printWidth: 100,
    trailingComma: 'none',
    proseWrap: 'always',
    sortPackageJson: false,
    ignorePatterns: ['AGENTS.md', 'storybook-static/**']
  },
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
  // updated version of vite broke Plugin type for existing plugins
  // @ts-ignore TS2321: excessive stack depth from recursive Plugin<any> generics
  plugins: [
    ...(useNitro ? nitro() : []),
    tailwindcss(),
    rsc({
      serverHandler: false
    }),
    tsrxReact(),

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
