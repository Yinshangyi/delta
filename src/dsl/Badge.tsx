/**
 * The one family for every "is this true or is this a guess" distinction
 * (spec §26, §33, §70).
 *
 * Principle 5 of design-brief.md: a distinction must survive colour-blindness,
 * so **no variant relies on hue**. Each carries at least two simultaneous
 * signals, and the word is always one of them — which also means the meaning
 * survives a greyscale print and a screen reader.
 *
 *   actual      solid border, filled      + the word
 *   forecast    dashed border, unfilled   + the word
 *   confirmed   solid border              + the word
 *   estimated   dashed border, ~ glyph    + the word
 *   sooner      ↓ glyph, positive hue     + the word
 *   later       ↑ glyph, negative hue     + the word
 *   unchanged   – glyph, muted            + the word
 */
export type BadgeKind =
  | "actual"
  | "forecast"
  | "confirmed"
  | "estimated"
  | "sooner"
  | "later"
  | "unchanged"

interface Variant {
  readonly label: string
  /** A second, non-colour signal. Empty where the border style carries it. */
  readonly glyph: string
  readonly className: string
}

const VARIANTS: Record<BadgeKind, Variant> = {
  actual: { label: "Actual", glyph: "", className: "border-solid bg-raised text-ink" },
  forecast: { label: "Forecast", glyph: "", className: "border-dashed text-muted" },
  confirmed: { label: "Confirmed", glyph: "", className: "border-solid bg-raised text-ink" },
  estimated: { label: "Estimated", glyph: "~", className: "border-dashed text-estimated" },
  sooner: { label: "sooner", glyph: "↓", className: "border-solid text-positive" },
  later: { label: "later", glyph: "↑", className: "border-solid text-negative" },
  unchanged: { label: "no change", glyph: "–", className: "border-solid text-muted" }
}

export type Signal = "word" | "glyph" | "border" | "fill"

/**
 * Which signals a kind carries. Exported so the "never hue alone" rule is a
 * unit test over data rather than an inspection of rendered markup — the rule
 * is a property of the table below, not of any particular DOM.
 */
export const signalsOf = (kind: BadgeKind): ReadonlyArray<Signal> => {
  const variant = VARIANTS[kind]
  const signals: Array<Signal> = ["word"]
  if (variant.glyph !== "") signals.push("glyph")
  if (variant.className.includes("border-dashed")) signals.push("border")
  // A fill is a lightness difference, which survives greyscale as readily as a
  // border style does. It is what distinguishes actual from forecast.
  if (variant.className.includes("bg-")) signals.push("fill")
  return signals
}

export interface BadgeProps {
  readonly kind: BadgeKind
  /** Replaces the default word — `3 months` becomes `3 months sooner`. */
  readonly children?: string
}

export function Badge({ kind, children }: BadgeProps) {
  const variant = VARIANTS[kind]
  const text = children === undefined ? variant.label : `${children} ${variant.label}`

  return (
    <span
      className={`border-line inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${variant.className}`}
    >
      {variant.glyph === "" ? null : <span aria-hidden="true">{variant.glyph}</span>}
      {text}
    </span>
  )
}

/** Spec §70: a physical asset's valuation is an estimate and the UI must say so. */
export const basisBadge = (basis: "actual" | "estimated"): BadgeKind =>
  basis === "actual" ? "confirmed" : "estimated"

/** A moved target date, as a badge kind. Negative months is earlier. */
export const shiftBadge = (monthsMoved: number): BadgeKind =>
  monthsMoved === 0 ? "unchanged" : monthsMoved < 0 ? "sooner" : "later"
