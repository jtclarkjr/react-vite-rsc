import type { ReactNode } from 'react'
import { PageLink } from '@/framework/page-link.tsx'
import { pageRoutes, type PageRouteHref } from '@/page-routes.generated.ts'
import { cn } from '@/lib/utils.ts'

type NavItem = {
  href: PageRouteHref
  label: string
  pathname: string
}

const navItems: NavItem[] = [
  { href: pageRoutes.home.href(), label: 'Home', pathname: pageRoutes.home.pattern },
  { href: pageRoutes.about.href(), label: 'About', pathname: pageRoutes.about.pattern },
  { href: pageRoutes.dashboard.href(), label: 'Dashboard', pathname: pageRoutes.dashboard.pattern }
]

export function AppShell(props: { children: ReactNode; pathname: string }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <PageLink
            href={pageRoutes.home.href()}
            className="text-sm font-bold tracking-[0.02em] text-foreground"
          >
            React, RSC, and Vite+
          </PageLink>
          <nav className="flex items-center gap-3">
            {navItems.map((item) => (
              <PageLink
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm transition-colors',
                  props.pathname === item.pathname ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </PageLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-5xl">{props.children}</div>
      </main>
    </div>
  )
}
