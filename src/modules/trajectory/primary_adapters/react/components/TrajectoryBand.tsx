import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as Money from "@/shared/domain/Money"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { MonthlyOutlook } from "@/modules/trajectory/core/domain/MonthlyOutlook"
import type { ReactNode } from "react"

export interface TrajectoryBandProps {
  readonly outlook: MonthlyOutlook
  readonly commitmentCount: number
}

/**
 * The three figures that drive the date, directly under it (APP-04).
 *
 * Context, not the point: larger than body text, far smaller than the date.
 * They were previously a panel below the chart, which put the cause of the
 * headline further down the page than the chart drawn from it.
 */
export function TrajectoryBand({ outlook, commitmentCount }: TrajectoryBandProps) {
  const copy = DASHBOARD_COPY.band
  const trajectory = DASHBOARD_COPY.trajectory

  return (
    <section className="border-line bg-surface grid rounded-lg border sm:grid-cols-3">
      <Figure
        label={copy.income}
        amount={MoneyText.money(outlook.typicalIncome)}
        note={trajectory.typicalNote}
      />
      <Figure
        label={copy.commitments}
        amount={MoneyText.money(Money.abs(outlook.typicalCommitments))}
        note={`${commitmentCount} ${copy.active}`}
        divided
      />
      <Figure
        label={copy.savings}
        amount={MoneyText.money(outlook.typicalNet)}
        negative={Money.isNegative(outlook.typicalNet)}
        note={
          outlook.lumpy ? (
            <>
              {trajectory.lumpyNote}{" "}
              <span className="text-ink tabular-nums">{MoneyText.money(outlook.averageNet)}</span>.
            </>
          ) : (
            copy.lessCommitments
          )
        }
        divided
      />
    </section>
  )
}

interface FigureProps {
  readonly label: string
  readonly amount: string
  readonly note: ReactNode
  readonly negative?: boolean
  readonly divided?: boolean
}

function Figure({ label, amount, note, negative = false, divided = false }: FigureProps) {
  return (
    <div
      className={`flex flex-col gap-1 p-5 ${divided ? "border-line border-t sm:border-t-0 sm:border-l" : ""}`}
    >
      <p className="eyebrow">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span
          className={`text-xl font-semibold tabular-nums ${negative ? "text-negative" : "text-ink"}`}
        >
          {amount}
        </span>
        <span className="text-muted text-sm">{DASHBOARD_COPY.band.perMonth}</span>
      </p>
      <p className="text-muted text-xs">{note}</p>
    </div>
  )
}
