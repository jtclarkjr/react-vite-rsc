import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'
import { pageRoutes } from '@/page-routes.generated.ts'
import type { PageProps } from '@/router.tsx'

export default function LoginPage(props: PageProps<'/login'>) {
  const redirectTarget = props.url.searchParams.get('redirect') ?? pageRoutes.dashboard.href()

  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Login</p>
      <div className="grid gap-4">
        <h1 className="m-0 text-4xl leading-none font-semibold tracking-tight sm:text-5xl">
          Demo Nitro auth gate.
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          This page is intentionally simple. Posting the form sets a demo auth cookie through a
          Nitro route handler, then redirects back to the protected page route.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4">
          <form action="/auth/login" method="post" className="grid gap-3">
            <input type="hidden" name="redirect" value={redirectTarget} />
            <Input
              aria-label="Demo username"
              autoComplete="username"
              defaultValue="demo-user"
              name="username"
            />
            <Button type="submit">Set demo auth cookie</Button>
          </form>
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            Protected target: <code>{redirectTarget}</code>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
