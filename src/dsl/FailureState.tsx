import type { ReactNode } from "react"

export interface FailureStateProps {
  readonly title: string
  /** Plain language. Never a stack trace, never an error code alone. */
  readonly detail: string
  readonly retry?: ReactNode
}

/**
 * A failed read shows this, never a blank page. It is deliberately not styled
 * as an alarm: the most likely cause is a database that has not opened yet, and
 * shouting at someone about their own finances helps nobody.
 *
 * Same min-height as the empty state, so a failed screen and a working one
 * occupy the same space.
 */
export function FailureState({ title, detail, retry }: FailureStateProps) {
  return (
    <div
      role="alert"
      className="border-line bg-surface flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border px-6 py-10 text-center"
    >
      <p className="text-ink text-base font-semibold">{title}</p>
      <p className="text-muted max-w-sm text-sm">{detail}</p>
      {retry === undefined ? null : <div className="mt-2">{retry}</div>}
    </div>
  )
}
