/**
 * A form draft into an override, or nothing.
 *
 * Returns `undefined` rather than throwing on an unusable value: the builder
 * runs this on every "add", and a half-typed number is an ordinary state of a
 * form rather than an error worth a message. The domain's own constructors do
 * the judging.
 */
import { Result } from "effect"

import { holdingId } from "@/modules/capital/core/domain/Holding"
import { commitmentId } from "@/modules/commitments/core/domain/Commitment"
import { incomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import {
  AddHypotheticalExpense,
  ChangeBillableDays,
  ChangeDailyRate,
  ChangeHoldingValue,
  ChangeIncome,
  ChangePayoutRatio,
  DisableCommitment,
  ExcludeHolding,
  overrideId
} from "@/modules/scenarios/core/domain/Scenario"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"

import type { IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type { OverrideId, ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"
import type { ChangeDraft } from "@/modules/scenarios/primary_adapters/react/components/AddChangeForm"

const euros = (value: string) => Result.getOrUndefined(Money.fromEuros(Number(value)))

/** The four that change a freelance or salary field. */
const incomeOverrideFrom = (
  at: OverrideId,
  draft: ChangeDraft,
  source: IncomeSourceId
): ScenarioOverride | undefined => {
  switch (draft.kind) {
    case "ChangeDailyRate": {
      const rate = Result.getOrUndefined(DailyRate.fromEuros(Number(draft.value)))
      return rate === undefined
        ? undefined
        : new ChangeDailyRate({ id: at, incomeSourceId: source, dailyRate: rate })
    }
    case "ChangeBillableDays": {
      const days = Result.getOrUndefined(BillableDays.fromNumber(Number(draft.value)))
      return days === undefined
        ? undefined
        : new ChangeBillableDays({ id: at, incomeSourceId: source, standard: days })
    }
    case "ChangePayoutRatio": {
      const ratio = Result.getOrUndefined(PayoutRatio.fromPercent(Number(draft.value)))
      return ratio === undefined
        ? undefined
        : new ChangePayoutRatio({ id: at, incomeSourceId: source, ratio })
    }
    case "ChangeIncome": {
      const amount = euros(draft.value)
      return amount === undefined
        ? undefined
        : new ChangeIncome({ id: at, incomeSourceId: source, monthlyNetBeforeTax: amount })
    }
    default:
      return undefined
  }
}

export const overrideFrom = (id: string, draft: ChangeDraft): ScenarioOverride | undefined => {
  const at = overrideId(id)
  const amount = euros(draft.value)
  const onIncome = incomeOverrideFrom(at, draft, incomeSourceId(draft.reference))
  if (onIncome !== undefined) return onIncome

  switch (draft.kind) {
    case "AddHypotheticalExpense": {
      const date = Result.getOrUndefined(LocalDate.parse(draft.date))
      return amount === undefined || date === undefined
        ? undefined
        : new AddHypotheticalExpense({ id: at, name: draft.name.trim(), amount, date })
    }
    case "DisableCommitment":
      return new DisableCommitment({ id: at, commitmentId: commitmentId(draft.reference) })
    case "ExcludeHolding":
      return new ExcludeHolding({ id: at, holdingId: holdingId(draft.reference) })
    case "ChangeHoldingValue":
      return amount === undefined
        ? undefined
        : new ChangeHoldingValue({ id: at, holdingId: holdingId(draft.reference), amount })
    default:
      return undefined
  }
}
