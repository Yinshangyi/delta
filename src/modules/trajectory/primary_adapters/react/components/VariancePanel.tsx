import { Badge } from "@/dsl/Badge"
import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as Money from "@/shared/domain/Money"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { PlanVariance } from "@/modules/trajectory/core/domain/PlanVariance"

export interface VariancePanelProps {
  readonly variance: PlanVariance | undefined
}

/**
 * Ahead or behind, in money and in months (TRJ-10).
 *
 * The standing is a word and a glyph before it is a colour, and the tone stays
 * level: being behind plan is information about the next few months, not a
 * verdict on the household.
 *
 * With nothing to compare against it says so, rather than showing a zero that
 * would read as being exactly on plan.
 */
export function VariancePanel({ variance }: VariancePanelProps) {
  const copy = DASHBOARD_COPY.variance

  if (variance === undefined) {
    return (
      <section className="border-line bg-surface flex flex-col gap-2 rounded-lg border p-5">
        <h2 className="text-ink text-sm font-semibold">{copy.title}</h2>
        <p className="text-ink text-sm">{copy.none}</p>
        <p className="text-muted text-xs">{copy.noneNote}</p>
      </section>
    )
  }

  const standing =
    variance.standing === "ahead"
      ? copy.ahead
      : variance.standing === "behind"
        ? copy.behind
        : copy.onPlan

  return (
    <section className="border-line bg-surface flex flex-col gap-3 rounded-lg border p-5">
      <h2 className="text-ink text-sm font-semibold">{copy.title}</h2>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-ink text-lg font-medium tabular-nums">
          {MoneyText.money(Money.abs(variance.difference))}
        </p>
        <p className="text-ink text-sm">{standing}</p>
        {variance.standing === "on-plan" ? null : (
          <Badge kind={variance.standing === "ahead" ? "sooner" : "later"}>
            {variance.standing === "ahead" ? "ahead" : "behind"}
          </Badge>
        )}
      </div>

      <dl className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted text-sm">{copy.expected}</dt>
          <dd className="text-ink text-sm tabular-nums">{MoneyText.money(variance.expected)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted text-sm">{copy.actual}</dt>
          <dd className="text-ink text-sm tabular-nums">{MoneyText.money(variance.actual)}</dd>
        </div>
      </dl>

      <p className="text-muted text-xs">
        {variance.monthsMoved === undefined || variance.monthsMoved === 0
          ? copy.unchanged
          : `${copy.moved} ${Math.abs(variance.monthsMoved)} ${
              Math.abs(variance.monthsMoved) === 1 ? "month" : "months"
            } ${variance.monthsMoved < 0 ? copy.movedSooner : copy.movedLater}.`}
      </p>
    </section>
  )
}
