import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card text-card-foreground border border-border rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  )
}
