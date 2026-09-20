import { Match } from "effect"

import { Button } from "@/dsl/Button"
import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import { CommitmentTotalsPanel } from "@/modules/commitments/primary_adapters/react/components/CommitmentTotalsPanel"
import { DebtDetail } from "@/modules/commitments/primary_adapters/react/components/DebtDetail"
import { TaxScheduleDetail } from "@/modules/commitments/primary_adapters/react/components/TaxScheduleDetail"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { Commitment } from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"
import type { CommitmentTotals } from "@/modules/commitments/core/use_cases/CommitmentsOverviewQuery"
import type { ReactNode } from "react"

export interface CommitmentDetailPanelProps {
  readonly commitment: Commitment | undefined
  readonly position: DebtPosition | undefined
  readonly totals: CommitmentTotals
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly busy: boolean
  /** The debt balance form, when the selection is a debt. */
  readonly balances: ReactNode
}

const plain = (headline: string, detail: string) => (
  <div className="flex flex-col gap-1">
    <p className="text-ink text-lg font-semibold tabular-nums">{headline}</p>
    <p className="text-muted text-sm">{detail}</p>
  </div>
)

/**
 * Holds the totals when nothing is selected (CMT-12) rather than collapsing:
 * an empty column beside a full list reads as something having gone wrong, and
 * the totals are worth a permanent home anyway.
 */
export function CommitmentDetailPanel({
  commitment,
  position,
  totals,
  onEdit,
  onDelete,
  busy,
  balances
}: CommitmentDetailPanelProps) {
  const copy = COMMITMENTS_COPY

  if (commitment === undefined) {
    return (
      <aside className="border-line bg-surface flex flex-col gap-4 rounded-lg border p-4">
        <CommitmentTotalsPanel totals={totals} />
        <p className="text-muted text-sm">{copy.detail.nothingSelected}</p>
      </aside>
    )
  }

  return (
    <aside className="border-line bg-surface flex flex-col gap-4 rounded-lg border p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-ink text-sm font-semibold">{commitment.name}</h3>
        {commitment.enabled ? null : <p className="text-muted text-xs">{copy.disabled.note}</p>}
      </header>

      {Match.valueTags(commitment, {
        RecurringExpense: (expense) =>
          plain(
            `${MoneyText.money(expense.amount)} a month`,
            `From ${DateText.day(expense.period.startDate)}${
              expense.period.endDate === undefined
                ? ""
                : ` until ${DateText.day(expense.period.endDate)}`
            }`
          ),
        OneOffExpense: (expense) =>
          plain(MoneyText.money(expense.amount), DateText.day(expense.date)),
        Debt: (debt) =>
          position === undefined ? null : <DebtDetail debt={debt} position={position} />,
        TaxLiability: (tax) => <TaxScheduleDetail tax={tax} />,
        RecurringTaxPayment: (payment) =>
          plain(
            `${MoneyText.money(payment.amount)} a month`,
            `From ${DateText.day(payment.period.startDate)}${
              payment.period.endDate === undefined
                ? ""
                : ` until ${DateText.day(payment.period.endDate)}`
            }`
          )
      })}

      {balances}

      {/*
        The destructive action sits apart from the primary one (CMT-12): a row
        of buttons where Delete is one click from Edit is how a commitment gets
        deleted by accident.
      */}
      <div className="border-line flex items-center justify-between gap-3 border-t pt-4">
        <Button tone="primary" disabled={busy} onClick={onEdit}>
          Edit
        </Button>
        <Button tone="ghost" disabled={busy} onClick={onDelete}>
          {copy.remove.action}
        </Button>
      </div>
    </aside>
  )
}
