import { Card, CardContent } from '@/components/ui/card.tsx'

const includedItems = [
  'React 19 with TypeScript',
  'Custom file-based page routes on top of the current RSC architecture',
  'Static and dynamic routes, including `src/routes/blog/[slug]/page.tsx` for `/blog/:slug` paths',
  'A blog server-action example using `useActionState` and progressive enhancement',
  'Zustand with SSR-friendly starter state hydration',
  'shadcn/ui-style Button, Input, and Card primitives',
  'Vite Plus build, lint, format, and test commands',
  'Feature code organized into dedicated folders instead of flat files under `src/features`'
]

export default function AboutPage() {
  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">About</p>
      <div className="grid gap-4">
        <h1 className="m-0 text-4xl leading-none font-semibold tracking-tight sm:text-5xl">
          Included by default.
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          The project stays intentionally small. It gives you a working React RSC baseline and
          leaves the feature layer to the next app.
        </p>
      </div>

      <Card>
        <CardContent>
          <ul className="m-0 grid gap-3 pl-5 text-base leading-7 text-foreground">
            {includedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
