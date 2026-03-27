import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils.ts'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border/70 bg-card/90 shadow-[0_18px_50px_rgba(17,24,39,0.08)] backdrop-blur',
        className
      )}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />
}
