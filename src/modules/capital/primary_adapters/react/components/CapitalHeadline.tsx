import { Badge } from "@/dsl/Badge"
import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import * as Money from "@/shared/domain/Money"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type * as YearMonth from "@/shared/domain/YearMonth"

export interface CapitalHeadlineProps {
  readonly total: Money.Money
  /** Absent where nothing is owed — there is then nothing to say (CAP-11). */
  readonly netWorth: Money.Money | undefined
  readonly targetDate: YearMonth.YearMonth | undefined
  readonly hasGoal: boolean
}

/**
 * Capital is the headline because capital is what drives the target date
 * (spec §77). Net worth sits beneath it, and only where debts exist — a line
 * reading "net worth: the same number" would be noise.
 *
 * The target date is here rather than on the dashboard because this is the
 * screen where it is being interrogated: every inclusion toggle below is a
 * question about it, and an answer you have to navigate to is not an answer
 * (CAP-07).
 */
export function CapitalHeadline({ total, netWorth, targetDate, hasGoal }: CapitalHeadlineProps) {
  const copy = CAPITAL_COPY

  return (
    <div className="border-line bg-surface flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-muted text-sm">{copy.total}</p>
        <p className="text-ink text-3xl font-semibold tracking-tight tabular-nums">
          {MoneyText.money(total)}
        </p>
        <p className="text-muted text-xs">{copy.totalNote}</p>

        {netWorth === undefined ? null : (
          <div className="mt-3 flex flex-col gap-0.5">
            <p className="text-muted text-sm">{copy.netWorth}</p>
            <p className="text-ink text-lg font-medium tabular-nums">{MoneyText.money(netWorth)}</p>
            <p className="text-muted text-xs">{copy.netWorthNote}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 sm:items-end">
        <p className="text-muted text-sm">{copy.targetDate}</p>
        {!hasGoal ? (
          <p className="text-ink text-lg font-medium">{copy.noGoal}</p>
        ) : targetDate === undefined ? (
          <p className="text-ink text-lg font-medium">{copy.noTarget}</p>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-ink text-lg font-medium">{DateText.month(targetDate)}</p>
            <Badge kind="forecast" />
          </div>
        )}
      </div>
    </div>
  )
}
