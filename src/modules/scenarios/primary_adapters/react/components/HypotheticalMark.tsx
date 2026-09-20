import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"

/**
 * The marking that says none of this is real (SCN-06).
 *
 * A dashed border, the word, and a repeating hatch — three signals, none of
 * them colour, so it survives greyscale and a colour-blind reader alike
 * (design-brief.md principle 5). It is deliberately loud: the one unrecoverable
 * mistake in this screen is believing a simulation already happened.
 */
export function HypotheticalMark() {
  return (
    <span className="border-line text-muted inline-flex items-center gap-1.5 rounded border border-dashed px-2 py-0.5 text-xs font-medium tracking-wide uppercase">
      <span aria-hidden="true">⁄⁄</span>
      {SCENARIOS_COPY.hypothetical}
    </span>
  )
}
