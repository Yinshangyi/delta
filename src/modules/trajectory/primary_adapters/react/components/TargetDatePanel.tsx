import { Badge } from "@/dsl/Badge"
import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as Money from "@/shared/domain/Money"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type * as YearMonth from "@/shared/domain/YearMonth"

export interface TargetDatePanelProps {
  readonly targetDate: YearMonth.YearMonth | undefined
  readonly capital: Money.Money
  readonly goal: Money.Money
  readonly netWorth: Money.Money | undefined
  /** Absent means reachable; present says why it is not (TRJ-09). */
  readonly shortfall: { readonly monthly: Money.Money; readonly reason: string } | undefined
}

const percentOf = (capital: Money.Money, goal: Money.Money): number =>
  Money.isPositive(goal)
    ? Math.min(100, Math.round((Money.toCents(capital) / Money.toCents(goal)) * 100))
    : 0

/**
 * The date dominates the composition (spec §37, §64) because it is the one
 * question the app exists to answer, and it is labelled an estimate because it
 * is one.
 *
 * When the goal cannot be reached this panel still answers rather than
 * erroring (TRJ-09): it says what the household is actually putting aside, and
 * points at the thing that would change it.
 */
export function TargetDatePanel({
  targetDate,
  capital,
  goal,
  netWorth,
  shortfall
}: TargetDatePanelProps) {
  const copy = DASHBOARD_COPY
  const percent = percentOf(capital, goal)

  return (
    <section className="border-line bg-surface flex flex-col gap-5 rounded-lg border p-6">
      {shortfall === undefined ? (
        <div className="flex flex-col gap-1">
          <p className="text-muted text-sm">{copy.onTrackFor}</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-ink text-4xl font-semibold tracking-tight">
              {targetDate === undefined ? "—" : DateText.month(targetDate)}
            </p>
            <Badge kind="forecast" />
          </div>
          <p className="text-muted text-xs">{copy.estimate}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-ink text-2xl font-semibold tracking-tight">{copy.unreachable.title}</p>
          <p className="text-muted text-sm">
            {Money.isNegative(shortfall.monthly)
              ? copy.unreachable.shortfallNegative
              : copy.unreachable.shortfall}{" "}
            <span className="text-ink font-medium tabular-nums">
              {MoneyText.money(Money.abs(shortfall.monthly))}
            </span>{" "}
            {copy.unreachable.aMonth}, {shortfall.reason}
          </p>
          <p className="text-muted text-sm">{copy.unreachable.suggestion}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-ink text-lg font-medium tabular-nums">{MoneyText.money(capital)}</p>
          <p className="text-muted text-sm tabular-nums">
            {copy.goal} {MoneyText.money(goal)}
          </p>
        </div>

        <div
          className="bg-raised h-2 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={copy.reached}
        >
          <div className="bg-accent h-full" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-muted text-xs">
          {percent}% {copy.reached}
        </p>

        {netWorth === undefined ? null : (
          <div className="border-line mt-2 flex items-baseline justify-between gap-3 border-t pt-3">
            <p className="text-muted text-sm">{copy.netWorth}</p>
            <p className="text-ink text-sm font-medium tabular-nums">{MoneyText.money(netWorth)}</p>
          </div>
        )}
      </div>
    </section>
  )
}
