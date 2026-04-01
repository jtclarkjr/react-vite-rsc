import { StarterHomeClient } from '@/components/starter-home-client.tsx'
import { createStarterAppState } from '@/features/starter/state.ts'

export default function HomePage() {
  const initialState = createStarterAppState(new Date().toISOString())

  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Starter</p>
      <div className="grid gap-4">
        <h1 className="m-0 max-w-4xl text-4xl leading-none font-semibold tracking-tight sm:text-6xl">
          Minimal React RSC boilerplate for Vite Plus.
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          This starter keeps file-based routes, React Server Components, SSR-friendly state
          hydration, shadcn/ui primitives, and Vite+ workflows without adding app-specific API code.
        </p>
        <p className="m-0 max-w-3xl text-base leading-7 text-muted-foreground">
          Try a dynamic route like{' '}
          <a href="/blog/example-slug" className="text-foreground underline">
            /blog/example-slug
          </a>{' '}
          to see route params resolved from the filesystem and a server action example.
        </p>
        <p className="m-0 max-w-3xl text-base leading-7 text-muted-foreground">
          Nitro also powers a protected page demo at{' '}
          <a href="/dashboard" className="text-foreground underline">
            /dashboard
          </a>{' '}
          and an API demo at{' '}
          <a href="/api/demo/request" className="text-foreground underline">
            /api/demo/request
          </a>
          , both of which are logged by a Nitro request plugin.
        </p>
      </div>

      <StarterHomeClient initialState={initialState} />
    </section>
  )
}
