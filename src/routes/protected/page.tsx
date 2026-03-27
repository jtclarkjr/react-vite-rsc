import { Card, CardContent } from '@/components/ui/card.tsx'
import {
  addProtectedGreeting,
  getDemoSessionFromContext,
  getProtectedGreetingFromContext,
  requireDemoSession
} from '@/features/demo-auth/session.ts'
import { ProtectedActionForm } from '@/features/protected/protected-action-form.tsx'
import { getProtectedNotes } from '@/features/protected/repository.ts'
import type { PageProps } from '@/router.tsx'

export const middleware = [requireDemoSession, addProtectedGreeting]

export default function ProtectedPage(props: PageProps) {
  const session = getDemoSessionFromContext(props.context)
  const greeting = getProtectedGreetingFromContext(props.context)
  const notes = getProtectedNotes()

  if (!session) {
    throw new Error('ProtectedPage requires demo session context.')
  }

  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Protected</p>
      <div className="grid gap-4">
        <h1 className="m-0 text-4xl leading-none font-semibold tracking-tight sm:text-5xl">
          Route middleware protected this page.
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          The page is only reachable when a <code>demo-session</code> cookie is present. The
          middleware also injects request-scoped context for the page render.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Session user
            </span>
            <span className="text-base text-foreground">{session.user}</span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Middleware greeting
            </span>
            <span className="text-base text-foreground">{greeting}</span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Requested path
            </span>
            <span className="text-base text-foreground">{props.url.pathname}</span>
          </div>
        </CardContent>
      </Card>

      <ProtectedActionForm notes={notes} />
    </section>
  )
}
