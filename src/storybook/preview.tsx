import type { Preview } from '@storybook/react-vite'
import '@/index.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: {
      expanded: true
    },
    backgrounds: {
      disable: true
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-4 text-foreground antialiased">
        <Story />
      </div>
    )
  ]
}

export default preview
