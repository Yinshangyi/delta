import { useId, useState } from "react"

import type { ReactNode } from "react"

export interface TooltipProps {
  readonly text: string
  readonly children: ReactNode
}

/**
 * A tooltip has to appear on hover *and* on keyboard focus, or half the users
 * never see it. `aria-describedby` is what makes it reach a screen reader; the
 * visual half is decoration on top of that.
 *
 * Deliberately not `title`: it is slow to appear, impossible to style, and on
 * touch it never appears at all.
 */
export function Tooltip({ text, children }: TooltipProps) {
  const id = useId()
  const [shown, setShown] = useState(false)

  return (
    <span className="relative inline-flex">
      <span
        aria-describedby={id}
        onMouseEnter={() => setShown(true)}
        onMouseLeave={() => setShown(false)}
        onFocus={() => setShown(true)}
        onBlur={() => setShown(false)}
        className="inline-flex"
      >
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        hidden={!shown}
        className="bg-ink text-ground absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded px-2 py-1 text-xs whitespace-nowrap"
      >
        {text}
      </span>
    </span>
  )
}
