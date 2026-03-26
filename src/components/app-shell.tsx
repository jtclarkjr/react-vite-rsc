import type { ReactNode } from 'react'
import { cn } from '@/lib/utils.ts'

type NavItem = {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' }
]

export function AppShell(props: { children: ReactNode; pathname: string }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="text-sm font-bold tracking-[0.02em] text-foreground">
            React, RSC, and Vite+
          </a>
          <nav className="flex items-center gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm transition-colors',
                  props.pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </a>
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
