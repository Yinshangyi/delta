import type { ReactNode } from "react"

export interface EmptyStateProps {
  readonly title: string
  /** What the screen is for, and what happens once it has something on it. */
  readonly description: string
  readonly action?: ReactNode
}

/**
 * An empty app must not look like a broken one. Every empty state says what
 * this screen is for and what to do next — a bare "No data" tells a person
 * neither.
 *
 * The min-height matches a populated panel's first rows, so arriving at a
 * screen and then adding to it does not jump the layout.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="border-line bg-surface flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      <p className="text-ink text-base font-semibold">{title}</p>
      <p className="text-muted max-w-sm text-sm">{description}</p>
      {action === undefined ? null : <div className="mt-2">{action}</div>}
    </div>
  )
}
