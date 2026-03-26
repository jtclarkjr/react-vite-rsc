'use client'

import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'
import type { StarterAppState } from '@/features/starter/state.ts'
import { useStarterAppSelector, useStarterAppStoreRef } from '@/features/starter/app-store.tsx'

export function StarterHomeClient(props: { initialState: StarterAppState }) {
  const store = useStarterAppStoreRef(props.initialState)
  const welcomeMessage = useStarterAppSelector(store, (state) => state.welcomeMessage)
  const serverRenderedAt = useStarterAppSelector(store, (state) => state.serverRenderedAt)
  const setWelcomeMessage = useStarterAppSelector(store, (state) => state.setWelcomeMessage)
  const resetWelcomeMessage = useStarterAppSelector(store, (state) => state.resetWelcomeMessage)

  return (
    <Card>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Welcome message</span>
          <Input
            value={welcomeMessage}
            onChange={(event) => setWelcomeMessage(event.target.value)}
            placeholder="Update store-backed state"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => resetWelcomeMessage()}>
            <RotateCcw className="size-4" />
            Reset message
          </Button>
        </div>

        <dl className="grid gap-4">
          <div className="grid gap-1">
            <dt className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Hydrated value
            </dt>
            <dd className="m-0 text-base text-foreground">{welcomeMessage}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Server rendered at
            </dt>
            <dd className="m-0 text-base text-foreground">
              {serverRenderedAt || 'Run the SSR server to populate this value during rendering.'}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
