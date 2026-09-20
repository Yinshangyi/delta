import { Badge } from "@/dsl/Badge"
import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { TaxLiability } from "@/modules/commitments/core/domain/Commitment"

export interface TaxScheduleDetailProps {
  readonly tax: TaxLiability
}

/**
 * The whole schedule, every row (spec §25). Not a monthly average and not a
 * summary: the uneven final instalment is the reason the schedule exists, and
 * it is only visible if every row is.
 */
export function TaxScheduleDetail({ tax }: TaxScheduleDetailProps) {
  const copy = COMMITMENTS_COPY.detail

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-ink text-lg font-semibold tabular-nums">
          {tax.status === "estimated"
            ? MoneyText.estimated(tax.amount)
            : MoneyText.money(tax.amount)}
        </p>
        <Badge kind={tax.status === "estimated" ? "estimated" : "confirmed"} />
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-ink text-sm font-semibold">{copy.schedule}</h4>
        <ul className="flex flex-col gap-1">
          {tax.paymentSchedule.map((payment) => (
            <li
              key={`${payment.date}`}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="text-muted">{DateText.day(payment.date)}</span>
              <span className="text-ink font-medium tabular-nums">
                {MoneyText.money(payment.amount)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted text-xs">{copy.scheduleNote}</p>
      </div>
    </div>
  )
}
