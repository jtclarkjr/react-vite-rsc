import { Card, CardContent } from '@/components/ui/card.tsx'
import { getBlogNotes } from '@/features/blog/repository.ts'
import { BlogActionForm } from '@/features/blog/blog-action-form.tsx'
import type { PageProps } from '@/router.tsx'

export default function DynamicBlogPage(props: PageProps) {
  const { slug } = props.params
  const notes = getBlogNotes(slug)

  return (
    <section className="grid gap-6">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Dynamic route</p>
      <div className="grid gap-4">
        <h1 className="m-0 text-4xl leading-none font-semibold tracking-tight sm:text-5xl">
          Blog slug: {slug}
        </h1>
        <p className="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
          This page is resolved by the filesystem route <code>src/routes/blog/[slug]/page.tsx</code>
          . It also demonstrates a server action bound to the current slug.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Requested path
            </span>
            <span className="text-base text-foreground">{props.url.pathname}</span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Decoded slug
            </span>
            <span className="text-base text-foreground">{slug}</span>
          </div>
        </CardContent>
      </Card>

      <BlogActionForm notes={notes} slug={slug} />
    </section>
  )
}
