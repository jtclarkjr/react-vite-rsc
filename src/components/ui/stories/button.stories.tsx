import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '@/components/ui/button.tsx'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Continue',
    variant: 'default',
    size: 'default',
    disabled: false
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost']
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg']
    }
  }
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    onClick: fn()
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: /continue/i }))

    await expect(args.onClick).toHaveBeenCalledOnce()
  }
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <RotateCcw className="size-4" />
        Reset
      </Button>
      <Button variant="outline">
        Continue
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Cannot submit'
  }
}
