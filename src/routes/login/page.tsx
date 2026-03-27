import type { PageProps } from '@/router.tsx'

export default function LoginPage(props: PageProps) {
  const next = props.url.searchParams.get('next') ?? '/protected'

  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Login</p>
      <div className="grid gap-4">
        <h1 className="m-0 text-4xl leading-none font-semibold tracking-tight sm:text-5xl">
          Demo auth placeholder
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          Route middleware redirected you here because the <code>demo-session</code> cookie is
          missing.
        </p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_18px_50px_rgba(17,24,39,0.08)] backdrop-blur">
        <p className="m-0 text-base leading-7 text-foreground">
          Set <code>demo-session=alex</code> in your browser cookies, then revisit{' '}
          <code>{next}</code> to test the middleware flow.
        </p>
      </div>
    </section>
  )
}
