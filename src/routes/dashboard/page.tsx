import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'

export default function DashboardPage() {
  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Dashboard</p>
      <div className="grid gap-4">
        <h1 className="m-0 text-4xl leading-none font-semibold tracking-tight sm:text-5xl">
          Protected before render.
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          Nitro middleware checked the auth cookie before this page route rendered. Without the
          cookie, the request is redirected to <code>/login</code> before the React page module
          runs.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4">
          <p className="m-0 text-base leading-7 text-foreground">
            Open the server logs and visit <code>/dashboard</code> or <code>/api/demo/request</code>{' '}
            to see the Nitro request logger classify page and API requests.
          </p>

          <form action="/auth/logout" method="post">
            <Button type="submit" variant="outline">
              Clear demo auth cookie
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
