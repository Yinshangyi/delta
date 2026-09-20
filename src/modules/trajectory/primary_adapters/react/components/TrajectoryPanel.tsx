import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as Money from "@/shared/domain/Money"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { MonthlyOutlook } from "@/modules/trajectory/core/domain/MonthlyOutlook"

export interface TrajectoryPanelProps {
  readonly outlook: MonthlyOutlook
}

/**
 * Where the money goes each month (TRJ-06).
 *
 * The "left over" figure is the typical month, and the panel says so — then
 * gives the average where lumpy payments make it different. A single figure
 * here would either hide an annual tax bill or spread it invisibly, and both
 * are claims the household cannot check against their own bank statement.
 */
export function TrajectoryPanel({ outlook }: TrajectoryPanelProps) {
  const copy = DASHBOARD_COPY.trajectory

  return (
    <section className="border-line bg-surface flex flex-col gap-3 rounded-lg border p-5">
      <h2 className="text-ink text-sm font-semibold">{copy.title}</h2>

      <dl className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted text-sm">{copy.income}</dt>
          <dd className="text-ink text-sm tabular-nums">
            {MoneyText.money(outlook.typicalIncome)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted text-sm">{copy.commitments}</dt>
          <dd className="text-ink text-sm tabular-nums">
            {MoneyText.money(outlook.typicalCommitments)}
          </dd>
        </div>
        <div className="border-line flex items-baseline justify-between gap-3 border-t pt-2">
          <dt className="text-ink text-sm font-medium">{copy.savings}</dt>
          <dd
            className={`text-sm font-semibold tabular-nums ${
              Money.isNegative(outlook.typicalNet) ? "text-negative" : "text-ink"
            }`}
          >
            {MoneyText.money(outlook.typicalNet)}
          </dd>
        </div>
      </dl>

      <p className="text-muted text-xs">
        {copy.typicalNote}{" "}
        {outlook.lumpy ? (
          <>
            {copy.lumpyNote}{" "}
            <span className="text-ink tabular-nums">{MoneyText.money(outlook.averageNet)}</span>.
          </>
        ) : (
          copy.steadyNote
        )}
      </p>
    </section>
  )
}
