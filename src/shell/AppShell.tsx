import { SECTIONS, type Section, titleOf, toHash } from "@/shell/routing/Section"

import type { ReactNode } from "react"

export interface AppShellProps {
  readonly current: Section
  readonly children: ReactNode
  /** Rendered in the sidebar's footer. The theme control arrives this way. */
  readonly aside?: ReactNode
}

/**
 * Props in, JSX out. The nav is real anchors, so keyboard navigation, focus
 * order and open-in-new-tab are the browser's job rather than ours.
 */
export function AppShell({ current, children, aside }: AppShellProps) {
  return (
    <div className="bg-ground text-ink flex min-h-dvh">
      <nav
        aria-label="Sections"
        className="border-line bg-surface flex w-56 shrink-0 flex-col border-r"
      >
        <p className="text-muted px-5 pt-6 pb-4 font-mono text-xs tracking-[0.2em] uppercase">
          Delta
        </p>

        <ul className="flex flex-col gap-0.5 px-2">
          {SECTIONS.map((section) => {
            const isCurrent = section === current
            return (
              <li key={section}>
                <a
                  href={toHash(section)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    isCurrent
                      ? "bg-accent-soft text-accent font-semibold"
                      : "text-muted hover:text-ink hover:bg-raised"
                  }`}
                >
                  {titleOf(section)}
                </a>
              </li>
            )
          })}
        </ul>

        {aside === undefined ? null : <div className="mt-auto px-3 py-4">{aside}</div>}
      </nav>

      <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
    </div>
  )
}
