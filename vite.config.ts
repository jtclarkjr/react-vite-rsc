import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'
import { voidPlugin } from 'void'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const isVitest = process.env.VITEST === 'true'

export default defineConfig(({ command }) => ({
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
    ignorePatterns: ['*.md', 'storybook-static/**']
  },
  test: {
    includeSource: ['src/**/*.{ts,tsx}', 'server/lib/**/*.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/.claude/**'],
    setupFiles: ['./vitest.setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@server': path.resolve(dirname, './server'),
      '@schema': path.resolve(dirname, './db/schema.ts')
    }
  },
  plugins: [
    ...(!isVitest
      ? [
          voidPlugin({ workerChildEnvironments: ['rsc', 'ssr'] }),
          {
            name: 'clean-void-worker-output',
            buildApp: {
              order: 'pre' as const,
              handler() {
                rmSync(path.resolve(dirname, 'dist/ssr'), { recursive: true, force: true })
              }
            }
          },
          rsc({ serverHandler: false })
        ]
      : []),
    tailwindcss(),
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
    void_worker: {
      build: {
        outDir: 'dist/ssr',
        emptyOutDir: false
      }
    },
    // `rsc` environment loads modules with `react-server` condition.
    // this environment is responsible for:
    // - RSC stream serialization (React VDOM -> RSC stream)
    // - server functions handling
    rsc: {
      define: {
        'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development')
      },
      build: {
        outDir: 'dist/ssr/rsc',
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
        'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development')
      },
      build: {
        outDir: 'dist/ssr/render',
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
            index: './src/main.client.ts'
          }
        }
      }
    }
  }
}))
