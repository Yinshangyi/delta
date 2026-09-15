import { SECTIONS, type Section, titleOf, toHash } from "@/shell/routing/Section"

import type { ReactNode } from "react"

export interface AppShellProps {
  readonly current: Section
  readonly children: ReactNode
}

/**
 * Props in, JSX out. The nav is real anchors, so keyboard navigation, focus
 * order and open-in-new-tab are the browser's job rather than ours.
 *
 * Designed at 1440 and required to hold up at 1024 (design-brief.md). Below
 * that the sidebar becomes a horizontal bar rather than eating half the width
 * — a narrow window is not a target, but it should not look broken either.
 */
export function AppShell({ current, children }: AppShellProps) {
  return (
    <div className="bg-ground text-ink flex min-h-dvh flex-col md:flex-row">
      <nav
        aria-label="Sections"
        className="border-line bg-surface flex shrink-0 flex-col border-b md:w-56 md:border-r md:border-b-0"
      >
        <p className="text-muted px-4 pt-4 pb-2 font-mono text-xs tracking-[0.2em] uppercase md:px-5 md:pt-6 md:pb-4">
          Delta
        </p>

        <ul className="flex gap-0.5 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-x-visible md:pb-0">
          {SECTIONS.map((section) => {
            const isCurrent = section === current
            return (
              <li key={section}>
                <a
                  href={toHash(section)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm whitespace-nowrap ${
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
      </nav>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8">{children}</main>
    </div>
  )
}
