import { useId } from "react"

import type { ReactNode } from "react"

export interface PopoverProps {
  readonly label: string
  readonly children: ReactNode
  readonly tone?: "secondary" | "ghost"
}

/**
 * The native Popover API. `popover="auto"` gives light dismiss, Escape, the top
 * layer and correct focus order without a single event listener, and CSS anchor
 * positioning places it without measuring anything.
 *
 * `popovertarget` also wires the trigger's `aria-expanded` and `aria-details`
 * for us, which is the part hand-rolled popovers routinely miss.
 */
export function Popover({ label, children, tone = "secondary" }: PopoverProps) {
  const id = useId()
  const anchor = `--anchor-${id.replaceAll(":", "")}`

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        style={{ anchorName: anchor } as React.CSSProperties}
        className={`rounded-md px-3 py-1.5 text-sm font-medium ${
          tone === "secondary"
            ? "bg-surface text-ink border-line hover:bg-raised border"
            : "text-muted hover:text-ink hover:bg-raised"
        }`}
      >
        {label}
      </button>
      <div
        id={id}
        popover="auto"
        style={
          {
            positionAnchor: anchor,
            positionArea: "block-end span-inline-end",
            positionTryFallbacks: "flip-block"
          } as React.CSSProperties
        }
        className="bg-surface text-ink border-line m-0 rounded-md border p-3 text-sm shadow-lg"
      >
        {children}
      </div>
    </>
  )
}
