/**
 * Scenario overrides applied to commitments (SCN-03).
 *
 * A hypothetical purchase becomes a real one-off commitment for the length of
 * the simulation, so the engine treats it exactly as it treats one the
 * household recorded. There is no second code path for imaginary money.
 *
 * The purchase keeps its override's id as the commitment's, which is what lets
 * a change-by-change decomposition attribute months to it.
 */
import { Match } from "effect"

import {
  Debt,
  OneOffExpense,
  RecurringExpense,
  RecurringTaxPayment,
  TaxLiability,
  commitmentId,
  type Commitment
} from "@/modules/commitments/core/domain/Commitment"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type {
  AddHypotheticalExpense,
  ScenarioOverride
} from "@/modules/scenarios/core/domain/Scenario"

const disabled = (commitment: Commitment): Commitment =>
  Match.valueTags(commitment, {
    RecurringExpense: (each) => new RecurringExpense({ ...each, enabled: false }),
    OneOffExpense: (each) => new OneOffExpense({ ...each, enabled: false }),
    Debt: (each) => new Debt({ ...each, enabled: false }),
    TaxLiability: (each) => new TaxLiability({ ...each, enabled: false }),
    RecurringTaxPayment: (each) => new RecurringTaxPayment({ ...each, enabled: false })
  })

const changedCommitment = (commitment: Commitment, override: ScenarioOverride): Commitment =>
  Match.valueTags(override, {
    DisableCommitment: (change) =>
      change.commitmentId === commitment.id ? disabled(commitment) : commitment,
    ChangeDailyRate: (): Commitment => commitment,
    ChangeBillableDays: (): Commitment => commitment,
    ChangePayoutRatio: (): Commitment => commitment,
    ChangeIncome: (): Commitment => commitment,
    AddHypotheticalExpense: (): Commitment => commitment,
    ExcludeHolding: (): Commitment => commitment,
    ChangeHoldingValue: (): Commitment => commitment
  })

const hypothetical = (household: HouseholdId, expense: AddHypotheticalExpense): Commitment =>
  new OneOffExpense({
    id: commitmentId(expense.id),
    householdId: household,
    name: expense.name,
    amount: expense.amount,
    date: expense.date,
    enabled: true
  })

export const overriddenCommitments = (
  commitments: ReadonlyArray<Commitment>,
  overrides: ReadonlyArray<ScenarioOverride>,
  household: HouseholdId
): ReadonlyArray<Commitment> => {
  const existing = commitments.map((commitment) => overrides.reduce(changedCommitment, commitment))

  const added = overrides.flatMap((override) =>
    Match.valueTags(override, {
      AddHypotheticalExpense: (expense): ReadonlyArray<Commitment> => [
        hypothetical(household, expense)
      ],
      ChangeDailyRate: (): ReadonlyArray<Commitment> => [],
      ChangeBillableDays: (): ReadonlyArray<Commitment> => [],
      ChangePayoutRatio: (): ReadonlyArray<Commitment> => [],
      ChangeIncome: (): ReadonlyArray<Commitment> => [],
      DisableCommitment: (): ReadonlyArray<Commitment> => [],
      ExcludeHolding: (): ReadonlyArray<Commitment> => [],
      ChangeHoldingValue: (): ReadonlyArray<Commitment> => []
    })
  )

  return [...existing, ...added]
}
