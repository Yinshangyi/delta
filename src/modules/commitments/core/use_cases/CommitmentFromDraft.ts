/**
 * A draft becomes a commitment, or a typed error. The one place raw form
 * values are judged.
 *
 * `id` is passed in rather than minted here: an edit keeps the id it already
 * had, and a new commitment gets one from the port — which is what lets the
 * same function serve both.
 */
import { Effect } from "effect"

import {
  type CommitmentId,
  Debt,
  OneOffExpense,
  RecurringExpense,
  RecurringTaxPayment,
  ScheduledPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"

import type { Commitment } from "@/modules/commitments/core/domain/Commitment"
import type {
  CommitmentDraft,
  DebtDraft,
  OneOffExpenseDraft,
  RecurringExpenseDraft,
  RecurringTaxPaymentDraft,
  TaxLiabilityDraft
} from "@/modules/commitments/core/use_cases/CommitmentDrafts"

export type InvalidCommitment =
  | Money.InvalidMoney
  | LocalDate.InvalidLocalDate
  | Percentage.InvalidPercentage
  | ActivePeriod.InvalidPeriod

const euros = (value: number) => Effect.fromResult(Money.fromEuros(value))
const day = (value: string) => Effect.fromResult(LocalDate.parse(value))

const periodFrom = (startDate: string, endDate: string | undefined) =>
  Effect.gen(function* () {
    const start = yield* day(startDate)
    const end = endDate === undefined || endDate === "" ? undefined : yield* day(endDate)
    return yield* Effect.fromResult(ActivePeriod.make(start, end))
  })

const recurringExpense = (id: CommitmentId, draft: RecurringExpenseDraft) =>
  Effect.gen(function* () {
    return new RecurringExpense({
      id,
      householdId: draft.household,
      name: draft.name.trim(),
      amount: yield* euros(draft.amountEuros),
      period: yield* periodFrom(draft.startDate, draft.endDate),
      enabled: true
    })
  })

const oneOffExpense = (id: CommitmentId, draft: OneOffExpenseDraft) =>
  Effect.gen(function* () {
    return new OneOffExpense({
      id,
      householdId: draft.household,
      name: draft.name.trim(),
      amount: yield* euros(draft.amountEuros),
      date: yield* day(draft.date),
      enabled: true
    })
  })

const debt = (id: CommitmentId, draft: DebtDraft) =>
  Effect.gen(function* () {
    return new Debt({
      id,
      householdId: draft.household,
      name: draft.name.trim(),
      initialAmount: yield* euros(draft.initialAmountEuros),
      interestRate: yield* Effect.fromResult(Percentage.fromPercent(draft.interestRatePercent)),
      regularPaymentAmount: yield* euros(draft.regularPaymentEuros),
      startDate: yield* day(draft.startDate),
      enabled: true
    })
  })

const taxLiability = (id: CommitmentId, draft: TaxLiabilityDraft) =>
  Effect.gen(function* () {
    return new TaxLiability({
      id,
      householdId: draft.household,
      name: draft.name.trim(),
      taxYear: draft.taxYear,
      status: draft.status,
      amount: yield* euros(draft.amountEuros),
      paymentSchedule: yield* Effect.all(
        draft.schedule.map((payment) =>
          Effect.gen(function* () {
            return new ScheduledPayment({
              date: yield* day(payment.date),
              amount: yield* euros(payment.amountEuros)
            })
          })
        )
      ),
      enabled: true
    })
  })

const recurringTaxPayment = (id: CommitmentId, draft: RecurringTaxPaymentDraft) =>
  Effect.gen(function* () {
    return new RecurringTaxPayment({
      id,
      householdId: draft.household,
      personId: draft.personId,
      name: draft.name.trim(),
      amount: yield* euros(draft.amountEuros),
      period: yield* periodFrom(draft.startDate, draft.endDate),
      enabled: true
    })
  })

export const commitmentFrom = (
  id: CommitmentId,
  draft: CommitmentDraft
): Effect.Effect<Commitment, InvalidCommitment> => {
  switch (draft.kind) {
    case "RecurringExpense":
      return recurringExpense(id, draft)
    case "OneOffExpense":
      return oneOffExpense(id, draft)
    case "Debt":
      return debt(id, draft)
    case "TaxLiability":
      return taxLiability(id, draft)
    case "RecurringTaxPayment":
      return recurringTaxPayment(id, draft)
  }
}
