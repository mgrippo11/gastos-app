import type { ReactNode } from 'react'

type Tone = 'success' | 'danger' | 'neutral'

const tones: Record<Tone, string> = {
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-muted text-muted-foreground',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${tones[tone]}`}>
      {children}
    </span>
  )
}
