import { Badge } from "@/dsl/Badge"
import { Button } from "@/dsl/Button"
import { EmptyState } from "@/dsl/EmptyState"
import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"
import * as DateText from "@/shared/presentation/DateText"

import type { ScenarioId } from "@/modules/scenarios/core/domain/Scenario"
import type * as YearMonth from "@/shared/domain/YearMonth"

export interface ScenarioRow {
  readonly id: ScenarioId
  readonly name: string
  readonly changes: ReadonlyArray<string>
  readonly targetDate: YearMonth.YearMonth | undefined
  readonly months: number | undefined
  readonly broken: boolean
}

export interface ScenarioListProps {
  readonly rows: ReadonlyArray<ScenarioRow>
  readonly baseline: YearMonth.YearMonth | undefined
  readonly onOpen: (id: ScenarioId) => void
  readonly onDelete: (id: ScenarioId) => void
  readonly onNew: () => void
  readonly busy: boolean
}

/**
 * Standing questions, answered against today's plan every time it is opened
 * (SCN-07). No "edited on" anywhere: what matters is whether the answer is
 * current, and it always is, because nothing is stored.
 */
export function ScenarioList({ rows, baseline, onOpen, onDelete, onNew, busy }: ScenarioListProps) {
  const copy = SCENARIOS_COPY.list

  return (
    <section className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        {copy.baseline}{" "}
        <span className="text-ink font-medium">
          {baseline === undefined ? "—" : DateText.month(baseline)}
        </span>
      </p>

      {rows.length === 0 ? (
        <EmptyState title={copy.empty} description={copy.emptyNote} />
      ) : (
        <ul className="border-line bg-surface rounded-lg border">
          {rows.map((row) => (
            <li key={row.id} className="border-line border-t first:border-t-0">
              <div className="hover:bg-raised flex items-start gap-3 px-3 py-3">
                <button
                  type="button"
                  onClick={() => onOpen(row.id)}
                  className="flex min-w-0 grow flex-col gap-1 text-left"
                >
                  <span className="text-ink text-sm font-medium">{row.name}</span>
                  <span className="text-muted text-xs">{row.changes.join(" · ")}</span>

                  <span className="flex flex-wrap items-center gap-2 pt-1">
                    {row.broken ? (
                      <span className="text-negative text-xs font-medium">{copy.broken}</span>
                    ) : (
                      <>
                        <span className="text-ink text-sm">
                          {row.targetDate === undefined
                            ? SCENARIOS_COPY.builder.noTarget
                            : DateText.month(row.targetDate)}
                        </span>
                        {row.months === undefined || row.months === 0 ? null : (
                          <>
                            <span className="text-ink text-sm tabular-nums">
                              {Math.abs(row.months)}{" "}
                              {Math.abs(row.months) === 1 ? "month" : "months"}{" "}
                              {row.months < 0
                                ? SCENARIOS_COPY.builder.sooner
                                : SCENARIOS_COPY.builder.later}
                            </span>
                            <Badge kind={row.months < 0 ? "sooner" : "later"} />
                          </>
                        )}
                      </>
                    )}
                  </span>
                </button>

                <Button tone="ghost" disabled={busy} onClick={() => onDelete(row.id)}>
                  {copy.delete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Button tone="primary" disabled={busy} onClick={onNew}>
          {copy.newScenario}
        </Button>
      </div>
    </section>
  )
}
