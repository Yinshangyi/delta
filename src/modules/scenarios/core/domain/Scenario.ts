/**
 * A scenario is a list of changes, not a copy of the household (spec §35).
 *
 * The distinction is the whole design. A scenario that duplicated the database
 * would answer the question it was asked on the day it was saved and go on
 * answering it months later, long after the rate, the rent and the balances
 * had moved. Overrides reference live entities by id and are applied on every
 * read, so a standing decision keeps giving a current answer.
 *
 * **Nothing computed is ever stored.** There is no target date on this type
 * and no delta; both come from running the engine twice, now (spec §36).
 *
 * The union is closed: a seventh kind of change is a type error in every
 * place that applies one, which is how each of those places gets updated.
 */
import { Brand, Data, Match } from "effect"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type * as BillableDays from "@/shared/domain/BillableDays"
import type * as DailyRate from "@/shared/domain/DailyRate"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"
import type * as PayoutRatio from "@/shared/domain/PayoutRatio"

export type ScenarioId = Brand.Branded<string, "ScenarioId">
export type OverrideId = Brand.Branded<string, "OverrideId">

export const scenarioId = (value: string): ScenarioId => value as ScenarioId
export const overrideId = (value: string): OverrideId => value as OverrideId

/** "What if the rate were €700?" (spec §34) */
export class ChangeDailyRate extends Data.TaggedClass("ChangeDailyRate")<{
  readonly id: OverrideId
  readonly incomeSourceId: IncomeSourceId
  readonly dailyRate: DailyRate.DailyRate
}> {}

/** "What if I billed only 16 days?" */
export class ChangeBillableDays extends Data.TaggedClass("ChangeBillableDays")<{
  readonly id: OverrideId
  readonly incomeSourceId: IncomeSourceId
  readonly standard: BillableDays.BillableDays
}> {}

/** "What if the payout ratio were different?" — the other half of freelance income. */
export class ChangePayoutRatio extends Data.TaggedClass("ChangePayoutRatio")<{
  readonly id: OverrideId
  readonly incomeSourceId: IncomeSourceId
  readonly ratio: PayoutRatio.PayoutRatio
}> {}

/** "What if we spent €11,500?" — a purchase that does not exist yet. */
export class AddHypotheticalExpense extends Data.TaggedClass("AddHypotheticalExpense")<{
  readonly id: OverrideId
  readonly name: string
  readonly amount: Money.Money
  readonly date: LocalDate.LocalDate
}> {}

/** "What if we dropped this?" */
export class DisableCommitment extends Data.TaggedClass("DisableCommitment")<{
  readonly id: OverrideId
  readonly commitmentId: CommitmentId
}> {}

/** "What if the salary were €3,600?" */
export class ChangeIncome extends Data.TaggedClass("ChangeIncome")<{
  readonly id: OverrideId
  readonly incomeSourceId: IncomeSourceId
  readonly monthlyNetBeforeTax: Money.Money
}> {}

/** "How far are we if we don't count the watches?" (spec §72, §75) */
export class ExcludeHolding extends Data.TaggedClass("ExcludeHolding")<{
  readonly id: OverrideId
  readonly holdingId: HoldingId
}> {}

/** "What if the bag fetches €6,500 rather than €5,000?" */
export class ChangeHoldingValue extends Data.TaggedClass("ChangeHoldingValue")<{
  readonly id: OverrideId
  readonly holdingId: HoldingId
  readonly amount: Money.Money
}> {}

export type ScenarioOverride =
  | ChangeDailyRate
  | ChangeBillableDays
  | ChangePayoutRatio
  | AddHypotheticalExpense
  | DisableCommitment
  | ChangeIncome
  | ExcludeHolding
  | ChangeHoldingValue

export type OverrideKind = ScenarioOverride["_tag"]

export class Scenario extends Data.Class<{
  readonly id: ScenarioId
  readonly householdId: HouseholdId
  readonly name: string
  /** Ordered: a later change wins over an earlier one on the same entity. */
  readonly overrides: ReadonlyArray<ScenarioOverride>
}> {}

export const kindOf = (override: ScenarioOverride): OverrideKind =>
  Match.valueTags(override, {
    ChangeDailyRate: () => "ChangeDailyRate" as const,
    ChangeBillableDays: () => "ChangeBillableDays" as const,
    ChangePayoutRatio: () => "ChangePayoutRatio" as const,
    AddHypotheticalExpense: () => "AddHypotheticalExpense" as const,
    DisableCommitment: () => "DisableCommitment" as const,
    ChangeIncome: () => "ChangeIncome" as const,
    ExcludeHolding: () => "ExcludeHolding" as const,
    ChangeHoldingValue: () => "ChangeHoldingValue" as const
  })

export const withoutOverride = (scenario: Scenario, override: OverrideId): Scenario =>
  new Scenario({
    ...scenario,
    overrides: scenario.overrides.filter((each) => each.id !== override)
  })
