'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'
import { addProtectedNote } from '@/features/protected/actions.tsx'
import {
  initialProtectedActionState,
  type ProtectedActionState
} from '@/features/protected/state.ts'

export function ProtectedActionForm(props: { notes: string[] }) {
  const [state, formAction] = useActionState<ProtectedActionState, FormData>(
    addProtectedNote,
    initialProtectedActionState
  )

  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="m-0 text-xl font-semibold">Protected server action</h2>
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            This form is intentionally guarded by route middleware before both the action call and
            the follow-up page render.
          </p>
        </div>

        <form action={formAction} className="grid gap-3">
          <Input name="note" placeholder="Save a note behind route middleware" />
          <div className="flex flex-wrap gap-3">
            <SubmitButton />
          </div>
        </form>

        {state.status !== 'idle' ? (
          <p
            className={`m-0 text-sm ${
              state.status === 'success' ? 'text-foreground' : 'text-destructive'
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <div className="grid gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Protected notes
          </span>
          {props.notes.length > 0 ? (
            <ul className="m-0 grid gap-2 pl-5 text-sm leading-6 text-foreground">
              {props.notes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm leading-6 text-muted-foreground">
              No protected notes yet. Add one after setting the demo session cookie.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save protected note'}
    </Button>
  )
}
