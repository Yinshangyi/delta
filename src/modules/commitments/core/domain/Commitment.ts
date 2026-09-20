/**
 * Money leaving the household, as a tagged union (spec §17).
 *
 * Five variants that keep their own meaning — a debt is not a recurring
 * expense with a name, and a tax schedule is not a monthly average — and one
 * translation below them into dated cash flows, so the projection never asks
 * which kind it is holding (§17, §29).
 *
 * Amounts are stored as positive magnitudes. What leaves the household is a
 * negative cash flow, but a screen says "€1,280 a month", and storing the sign
 * would mean every form and every total remembering to flip it.
 */
import { Brand, Data } from "effect"

import type { HouseholdId, PersonId } from "@/modules/household/core/domain/Household"
import type { ActivePeriod } from "@/shared/domain/ActivePeriod"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"
import type * as Percentage from "@/shared/domain/Percentage"

export type CommitmentId = Brand.Branded<string, "CommitmentId">

export const commitmentId = (value: string): CommitmentId => value as CommitmentId

/**
 * Spec §25: a dated amount, because real schedules have an uneven final
 * instalment. A `monthlyAmount` field would be the bug this type exists to
 * prevent.
 */
export class ScheduledPayment extends Data.Class<{
  readonly date: LocalDate.LocalDate
  readonly amount: Money.Money
}> {}

export type TaxStatus = "estimated" | "confirmed"

/** Rent, subscriptions, family support — anything monthly (spec §18). */
export class RecurringExpense extends Data.TaggedClass("RecurringExpense")<{
  readonly id: CommitmentId
  readonly householdId: HouseholdId
  readonly name: string
  readonly amount: Money.Money
  readonly period: ActivePeriod
  readonly enabled: boolean
}> {}

/** A known or hypothetical purchase on one date (spec §19). */
export class OneOffExpense extends Data.TaggedClass("OneOffExpense")<{
  readonly id: CommitmentId
  readonly householdId: HouseholdId
  readonly name: string
  readonly amount: Money.Money
  readonly date: LocalDate.LocalDate
  readonly enabled: boolean
}> {}

/**
 * First-class, never a recurring expense (spec §20): Delta tracks its state,
 * and its payments stop when the balance reaches zero.
 */
export class Debt extends Data.TaggedClass("Debt")<{
  readonly id: CommitmentId
  readonly householdId: HouseholdId
  readonly name: string
  readonly initialAmount: Money.Money
  /** Recorded; V1's arithmetic is spec §22's, which is the 0% formula. */
  readonly interestRate: Percentage.Percentage
  readonly regularPaymentAmount: Money.Money
  readonly startDate: LocalDate.LocalDate
  readonly enabled: boolean
}> {}

/** A tax bill and the dates it is actually paid on (spec §24, §26). */
export class TaxLiability extends Data.TaggedClass("TaxLiability")<{
  readonly id: CommitmentId
  readonly householdId: HouseholdId
  readonly name: string
  readonly taxYear: number | undefined
  readonly status: TaxStatus
  readonly amount: Money.Money
  readonly paymentSchedule: ReadonlyArray<ScheduledPayment>
  readonly enabled: boolean
}> {}

/**
 * A monthly levy such as PAS (spec §27). Kept apart from `TaxLiability`
 * because a rate change is modelled as ending one rule and starting another,
 * which preserves what was actually paid.
 */
export class RecurringTaxPayment extends Data.TaggedClass("RecurringTaxPayment")<{
  readonly id: CommitmentId
  readonly householdId: HouseholdId
  readonly personId: PersonId | undefined
  readonly name: string
  readonly amount: Money.Money
  readonly period: ActivePeriod
  readonly enabled: boolean
}> {}

export type Commitment =
  | RecurringExpense
  | OneOffExpense
  | Debt
  | TaxLiability
  | RecurringTaxPayment

export type CommitmentKind = Commitment["_tag"]
