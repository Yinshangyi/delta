import { Badge } from "@/dsl/Badge"
import { HypotheticalMark } from "@/modules/scenarios/primary_adapters/react/components/HypotheticalMark"
import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"
import * as DateText from "@/shared/presentation/DateText"

import type { TimeCost } from "@/modules/scenarios/core/domain/TimeCost"
import type { ChangeSummary } from "@/modules/scenarios/primary_adapters/react/ChangeSummary"

export interface ComparisonPanelProps {
  readonly cost: TimeCost
  readonly changes: ReadonlyArray<ChangeSummary>
}

const monthsText = (months: number): string =>
  `${Math.abs(months)} ${Math.abs(months) === 1 ? "month" : "months"}`

/**
 * Current beside simulation, and the delta as the outcome (spec §34).
 *
 * The decomposition is the part worth reading: with several changes stacked,
 * "the holiday costs 1 month, the rate rise buys 4 back" is a different and
 * more useful statement than "3 months sooner".
 */
export function ComparisonPanel({ cost, changes }: ComparisonPanelProps) {
  const copy = SCENARIOS_COPY.builder
  const labelOf = (id: string) => changes.find((change) => change.id === id)?.detail ?? id

  return (
    <section className="border-line bg-surface flex flex-col gap-4 rounded-lg border p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="text-muted text-sm">{copy.current}</p>
          <p className="text-ink text-xl font-semibold tracking-tight">
            {cost.baseline === undefined ? copy.noTarget : DateText.month(cost.baseline)}
          </p>
        </div>

        <div className="border-line flex flex-col gap-1 border-dashed sm:border-l sm:pl-4">
          <div className="flex items-center gap-2">
            <p className="text-muted text-sm">{copy.simulation}</p>
            <HypotheticalMark />
          </div>
          <p className="text-ink text-xl font-semibold tracking-tight">
            {cost.simulated === undefined ? copy.noTarget : DateText.month(cost.simulated)}
          </p>
        </div>
      </div>

      <div className="border-line flex flex-wrap items-center gap-2 border-t pt-4">
        <p className="text-muted text-sm">{copy.impact}</p>
        {cost.months === undefined ? (
          <p className="text-ink text-sm">{copy.unknown}</p>
        ) : cost.months === 0 ? (
          <p className="text-ink text-sm">{copy.unchanged}</p>
        ) : (
          <>
            <p className="text-ink text-lg font-semibold">
              {monthsText(cost.months)} {cost.months < 0 ? copy.sooner : copy.later}
            </p>
            <Badge kind={cost.months < 0 ? "sooner" : "later"} />
          </>
        )}
      </div>

      {cost.perChange.length <= 1 ? null : (
        <div className="border-line flex flex-col gap-2 border-t pt-4">
          <h3 className="text-ink text-sm font-semibold">{copy.breakdown}</h3>
          <ul className="flex flex-col gap-1">
            {cost.perChange.map((change) => (
              <li
                key={change.override}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="text-muted">{labelOf(change.override)}</span>
                <span className="text-ink tabular-nums">
                  {change.months === undefined
                    ? "—"
                    : change.months === 0
                      ? copy.unchanged
                      : `${monthsText(change.months)} ${
                          change.months < 0 ? copy.sooner : copy.later
                        }`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
