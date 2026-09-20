import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"

import type { BrokenReference } from "@/modules/scenarios/core/domain/BrokenReferences"

export interface BrokenScenarioNoticeProps {
  readonly broken: ReadonlyArray<BrokenReference>
}

/**
 * Names what broke (SCN-10).
 *
 * Delta could drop the override and carry on, and the scenario would then
 * answer a question nobody asked — "sell the watch" against a deleted watch
 * becomes "change nothing". So it says which change, and what it pointed at,
 * and shows no impact until the household decides.
 */
export function BrokenScenarioNotice({ broken }: BrokenScenarioNoticeProps) {
  const copy = SCENARIOS_COPY.broken

  if (broken.length === 0) return null

  return (
    <section className="border-negative bg-surface flex flex-col gap-2 rounded-lg border border-dashed p-4">
      <h3 className="text-ink text-sm font-semibold">{copy.title}</h3>
      <ul className="flex flex-col gap-1">
        {broken.map((reference) => (
          <li key={reference.override} className="text-muted text-sm">
            <span className="text-ink">{reference.kind}</span> {copy.missing} {reference.missing}{" "}
            {copy.thatIsGone}.
          </li>
        ))}
      </ul>
      <p className="text-muted text-xs">{copy.note}</p>
    </section>
  )
}
