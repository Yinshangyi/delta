/**
 * The six sections, and no more (spec §76, amending §59 from four).
 *
 * The nav mirrors the domain: what you have, what you owe, where you are
 * going, what if. There is deliberately nothing here for transactions,
 * accounts, taxes, debt or budgets — taxes and debt live inside Commitments,
 * and the user never enters a transaction at all.
 */
export const SECTIONS = [
  "dashboard",
  "projection",
  "capital",
  "commitments",
  "scenarios",
  "settings"
] as const

export type Section = (typeof SECTIONS)[number]

export const DEFAULT_SECTION: Section = "dashboard"

const isSection = (value: string): value is Section =>
  (SECTIONS as ReadonlyArray<string>).includes(value)

/** `#/capital` → `capital`. Anything unrecognised lands on the dashboard. */
export const fromHash = (hash: string): Section => {
  const candidate = hash.replace(/^#\/?/, "").split(/[?/]/)[0] ?? ""
  return isSection(candidate) ? candidate : DEFAULT_SECTION
}

export const toHash = (section: Section): string => `#/${section}`

const TITLES: Record<Section, string> = {
  dashboard: "Dashboard",
  projection: "Projection",
  capital: "Capital",
  commitments: "Commitments",
  scenarios: "Scenarios",
  settings: "Settings"
}

export const titleOf = (section: Section): string => TITLES[section]
