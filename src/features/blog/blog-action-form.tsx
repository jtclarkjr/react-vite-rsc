'use client'

import * as React from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'
import { addBlogNote } from '@/features/blog/actions.tsx'
import { initialBlogActionState, type BlogActionState } from '@/features/blog/state.ts'

export function BlogActionForm(props: { notes: string[]; slug: string }) {
  const action = addBlogNote.bind(null, props.slug)
  const [state, formAction] = React.useActionState<BlogActionState, FormData>(
    action,
    initialBlogActionState
  )

  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="m-0 text-xl font-semibold">Server action example</h2>
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            Submit this form to call a server action tied to the current blog slug. It works with
            the current RSC wiring and supports progressive enhancement.
          </p>
        </div>

        <form action={formAction} className="grid gap-3">
          <Input name="note" placeholder={`Add a note for ${props.slug}`} />
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
            Recent server notes
          </span>
          {props.notes.length > 0 ? (
            <ul className="m-0 grid gap-2 pl-5 text-sm leading-6 text-foreground">
              {props.notes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm leading-6 text-muted-foreground">
              No notes yet. Submit the form to persist one in the server process.
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
      {pending ? 'Saving…' : 'Save server note'}
    </Button>
  )
}
