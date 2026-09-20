/**
 * An override into columns. A column per parameter rather than a JSON blob:
 * a blob cannot be read back into a closed union without trusting whatever
 * was written, and the union's whole value is that an unhandled kind is a
 * compile error rather than a silent no-op.
 */
import { Match } from "effect"

import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as Percentage from "@/shared/domain/Percentage"

import type { ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"
import type { OverrideColumns } from "@/modules/scenarios/secondary_adapters/OverrideRows"

const empty: Omit<OverrideColumns, "kind"> = {
  income_source_id: null,
  commitment_id: null,
  holding_id: null,
  amount_cents: null,
  basis_points: null,
  days: null,
  date: null,
  name: null
}

const on = (kind: string, extra: Partial<Omit<OverrideColumns, "kind">>): OverrideColumns => ({
  ...empty,
  ...extra,
  kind
})

export const columnsOf = (override: ScenarioOverride): OverrideColumns =>
  Match.valueTags(override, {
    ChangeDailyRate: (change) =>
      on("ChangeDailyRate", {
        income_source_id: change.incomeSourceId,
        amount_cents: Money.toCents(DailyRate.toMoney(change.dailyRate))
      }),
    ChangeBillableDays: (change) =>
      on("ChangeBillableDays", {
        income_source_id: change.incomeSourceId,
        days: BillableDays.toNumber(change.standard)
      }),
    ChangePayoutRatio: (change) =>
      on("ChangePayoutRatio", {
        income_source_id: change.incomeSourceId,
        basis_points: Percentage.toBasisPoints(PayoutRatio.toPercentage(change.ratio))
      }),
    ChangeIncome: (change) =>
      on("ChangeIncome", {
        income_source_id: change.incomeSourceId,
        amount_cents: Money.toCents(change.monthlyNetBeforeTax)
      }),
    AddHypotheticalExpense: (change) =>
      on("AddHypotheticalExpense", {
        amount_cents: Money.toCents(change.amount),
        date: LocalDate.toIso(change.date),
        name: change.name
      }),
    DisableCommitment: (change) => on("DisableCommitment", { commitment_id: change.commitmentId }),
    ExcludeHolding: (change) => on("ExcludeHolding", { holding_id: change.holdingId }),
    ChangeHoldingValue: (change) =>
      on("ChangeHoldingValue", {
        holding_id: change.holdingId,
        amount_cents: Money.toCents(change.amount)
      })
  })
