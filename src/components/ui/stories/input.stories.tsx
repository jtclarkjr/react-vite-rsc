import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Input } from '@/components/ui/input.tsx'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    type: 'text',
    placeholder: 'name@company.com',
    disabled: false
  }
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox')

    await userEvent.click(input)
    await userEvent.type(input, 'alex@company.com')

    await expect(input).toHaveValue('alex@company.com')
  }
}

export const States: Story = {
  render: () => (
    <div className="grid max-w-md gap-4">
      <Input placeholder="Email address" />
      <Input defaultValue="alex@company.com" />
      <Input aria-invalid defaultValue="invalid-address" />
      <Input disabled defaultValue="Disabled field" />
    </div>
  )
}

export const FileInput: Story = {
  args: {
    type: 'file'
  }
}
