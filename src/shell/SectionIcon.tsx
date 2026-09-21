import type { Section } from "@/shell/routing/Section"

/**
 * Drawn inline rather than pulled from an icon font or a package: six glyphs
 * is less code than a dependency, they inherit `currentColor` so both themes
 * are free, and nothing downloads at runtime — which is the same reason the
 * fonts are self-hosted.
 *
 * Each is decorative. The nav item's text is the accessible name, so these
 * carry `aria-hidden` and never become the only way to tell two items apart
 * (design-brief.md principle 5).
 */
const PATHS: Record<Section, string> = {
  // A roof over a door.
  dashboard: "M3 9.2 10 3.5l7 5.7V17H3V9.2Z M8 17v-4.5h4V17",
  // A rising line.
  projection: "M3 15.5 7.5 10l3 3L17 5.5 M17 5.5h-4 M17 5.5v4",
  // A card with a stripe.
  capital: "M2.5 5.5h15v9h-15v-9Z M2.5 8.5h15",
  // A list.
  commitments: "M3 5.5h14 M3 10h14 M3 14.5h14",
  // A trend with a fork.
  scenarios: "M3 16 8 8l3 2.5L17 4 M11 16h6v-6",
  // A sun.
  settings:
    "M10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z M10 2v2 M10 16v2 M2 10h2 M16 10h2 M4.3 4.3l1.4 1.4 M14.3 14.3l1.4 1.4 M15.7 4.3l-1.4 1.4 M5.7 14.3l-1.4 1.4"
}

export function SectionIcon({ section }: { readonly section: Section }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[section]} />
    </svg>
  )
}
