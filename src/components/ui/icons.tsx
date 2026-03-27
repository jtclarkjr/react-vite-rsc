import type { SVGProps } from 'react'
import { cn } from '@/lib/utils.ts'

type IconProps = SVGProps<SVGSVGElement>

function getAriaAttributes(props: IconProps) {
  return props['aria-label'] ? { role: 'img' as const } : { 'aria-hidden': true as const }
}

export function ArrowRight({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      focusable="false"
      {...getAriaAttributes(props)}
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

export function RotateCcw({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      focusable="false"
      {...getAriaAttributes(props)}
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  )
}
