import { progressOf } from "@/modules/commitments/core/domain/DebtAmortisation"
import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import * as Percentage from "@/shared/domain/Percentage"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { Debt } from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"

export interface DebtDetailProps {
  readonly debt: Debt
  readonly position: DebtPosition
}

/**
 * Spec §23's panel: €11,000 → €7,200, a bar, 35% repaid, the payment, the
 * months left and the payoff month.
 *
 * Two things are said rather than implied. Where the remaining balance came
 * from — a recorded balance or the initial amount — because the whole
 * recalibration loop turns on that distinction; and that the projection
 * ignores the interest rate, which is true and would otherwise be a silent
 * overstatement of progress.
 */
export function DebtDetail({ debt, position }: DebtDetailProps) {
  const copy = COMMITMENTS_COPY.detail
  const progress = progressOf(debt, position.remaining, position.from)
  const hasInterest = Percentage.toBasisPoints(debt.interestRate) > 0

  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink text-lg font-semibold tabular-nums">
        {MoneyText.money(progress.initial)} → {MoneyText.money(progress.remaining)}
      </p>

      <div className="flex flex-col gap-1.5">
        <div
          className="bg-raised h-2 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress.percentRepaid}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${debt.name} ${copy.repaid}`}
        >
          <div className="bg-accent h-full" style={{ width: `${progress.percentRepaid}%` }} />
        </div>
        <p className="text-muted text-xs">
          {progress.percentRepaid}% {copy.repaid}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-muted text-xs">{copy.payment}</dt>
          <dd className="text-ink text-sm font-medium tabular-nums">
            {MoneyText.money(debt.regularPaymentAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-muted text-xs">{copy.monthsRemaining}</dt>
          <dd className="text-ink text-sm font-medium tabular-nums">
            {progress.paymentsRemaining === undefined
              ? "—"
              : `${progress.paymentsRemaining} ${copy.months}`}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted text-xs">{copy.payoff}</dt>
          <dd className="text-ink text-sm font-medium">
            {progress.payoffMonth === undefined
              ? copy.noPayoff
              : DateText.month(progress.payoffMonth)}
          </dd>
        </div>
      </dl>

      <p className="text-muted text-xs">
        {position.fromSnapshot ? copy.fromSnapshot : copy.fromInitial}
      </p>
      {hasInterest ? <p className="text-muted text-xs">{copy.interestNote}</p> : null}
    </div>
  )
}
