import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <Card>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <h3 className="m-0 text-xl font-semibold">Starter panel</h3>
            <p className="m-0 text-sm leading-6 text-muted-foreground">
              Use cards to group related app actions and metadata.
            </p>
          </div>
          <Button className="w-fit">Open details</Button>
        </CardContent>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/starter panel/i)).toBeVisible()
    await expect(canvas.getByRole('button', { name: /open details/i })).toBeVisible()
  }
}

export const ContentOnly: Story = {
  render: () => (
    <div className="max-w-sm p-6">
      <Card>
        <CardContent>
          <p className="m-0 text-sm text-muted-foreground">
            This compact example shows the default card surface and spacing.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
