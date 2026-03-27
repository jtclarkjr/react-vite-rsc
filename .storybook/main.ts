import tailwindcss from '@tailwindcss/vite'
import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite-plus'

const reactDeps = ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime']

const config: StorybookConfig = {
  stories: ['../src/components/ui/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: '.storybook/vite.config.ts'
      }
    }
  },
  viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      optimizeDeps: {
        include: reactDeps
      },
      ssr: {
        noExternal: reactDeps,
        optimizeDeps: {
          include: reactDeps
        }
      }
    })
  }
}

export default config
