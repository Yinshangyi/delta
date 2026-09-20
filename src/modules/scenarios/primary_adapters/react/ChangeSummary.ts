/**
 * One override in words (SCN-06, SCN-07).
 *
 * Named by what it does to the household rather than by its type: "Consulting
 * at €700 a day" reads as a decision, "ChangeDailyRate(f1, 70000)" reads as a
 * row in a database.
 */
import { Match } from "effect"

import { CHANGE_LABELS } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as Percentage from "@/shared/domain/Percentage"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { OverrideId, ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"

export interface ChangeSummary {
  readonly id: OverrideId
  readonly label: string
  readonly detail: string
}

/**
 * Names are resolved by the caller, which has the live entities. An override
 * pointing at something deleted therefore reads as its id rather than
 * silently as nothing — and SCN-10 marks it separately.
 */
export type NameOf = (reference: string) => string | undefined

export const summarise = (override: ScenarioOverride, nameOf: NameOf): ChangeSummary => {
  const named = (reference: string) => nameOf(reference) ?? reference

  const detail = Match.valueTags(override, {
    ChangeDailyRate: (change) =>
      `${named(change.incomeSourceId)} at ${MoneyText.money(DailyRate.toMoney(change.dailyRate))} a day`,
    ChangeBillableDays: (change) =>
      `${named(change.incomeSourceId)} at ${BillableDays.toNumber(change.standard)} days a month`,
    ChangePayoutRatio: (change) =>
      `${named(change.incomeSourceId)} paying out ${Percentage.toPercent(
        PayoutRatio.toPercentage(change.ratio)
      )}%`,
    ChangeIncome: (change) =>
      `${named(change.incomeSourceId)} at ${MoneyText.money(change.monthlyNetBeforeTax)} a month`,
    AddHypotheticalExpense: (change) =>
      `${change.name}, ${MoneyText.money(change.amount)} on ${DateText.day(change.date)}`,
    DisableCommitment: (change) => `${named(change.commitmentId)} dropped`,
    ExcludeHolding: (change) => `${named(change.holdingId)} not counted`,
    ChangeHoldingValue: (change) =>
      `${named(change.holdingId)} worth ${MoneyText.money(change.amount)}`
  })

  const label = Match.valueTags(override, {
    ChangeDailyRate: () => CHANGE_LABELS.ChangeDailyRate,
    ChangeBillableDays: () => CHANGE_LABELS.ChangeBillableDays,
    ChangePayoutRatio: () => CHANGE_LABELS.ChangePayoutRatio,
    ChangeIncome: () => CHANGE_LABELS.ChangeIncome,
    AddHypotheticalExpense: () => CHANGE_LABELS.AddHypotheticalExpense,
    DisableCommitment: () => CHANGE_LABELS.DisableCommitment,
    ExcludeHolding: () => CHANGE_LABELS.ExcludeHolding,
    ChangeHoldingValue: () => CHANGE_LABELS.ChangeHoldingValue
  })

  return { id: override.id, label, detail }
}
