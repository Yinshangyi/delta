import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import * as Money from "@/shared/domain/Money"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { CommitmentTotals } from "@/modules/commitments/core/use_cases/CommitmentsOverviewQuery"

export interface CommitmentTotalsPanelProps {
  readonly totals: CommitmentTotals
}

/**
 * Spec CMT-11 asks for totals stated honestly. The monthly figure and the
 * scheduled tax are shown apart and never summed — adding them produces a
 * number that is true of no month at all — and the scheduled line says why.
 */
export function CommitmentTotalsPanel({ totals }: CommitmentTotalsPanelProps) {
  const copy = COMMITMENTS_COPY.totals

  const lines = [
    { label: copy.monthly, amount: totals.monthly, note: undefined },
    { label: copy.scheduled, amount: totals.scheduledTax, note: copy.scheduledNote },
    { label: copy.oneOff, amount: totals.oneOff, note: undefined },
    { label: copy.outstandingDebt, amount: totals.outstandingDebt, note: undefined }
  ].filter((line) => !Money.isZero(line.amount))

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-ink text-sm font-semibold">{copy.title}</h3>

      {lines.length === 0 ? (
        <p className="text-muted text-sm">{copy.nothing}</p>
      ) : (
        <dl className="flex flex-col gap-3">
          {lines.map((line) => (
            <div key={line.label} className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted text-sm">{line.label}</dt>
                <dd className="text-ink text-sm font-medium tabular-nums">
                  {MoneyText.money(line.amount)}
                </dd>
              </div>
              {line.note === undefined ? null : <p className="text-muted text-xs">{line.note}</p>}
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
