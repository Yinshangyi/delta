/**
 * Rows in, domain out. A row is data from outside the program — written by an
 * older version, or restored from an import — so every value is validated back
 * into its type rather than cast, and a row that cannot be is a
 * `PersistenceError` rather than a half-built commitment loose in a projection.
 */
import { Effect, Result } from "effect"

import {
  commitmentId,
  Debt,
  OneOffExpense,
  RecurringExpense,
  RecurringTaxPayment,
  ScheduledPayment,
  TaxLiability,
  type TaxStatus
} from "@/modules/commitments/core/domain/Commitment"
import { householdId, personId } from "@/modules/household/core/domain/Household"
import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"
import { type PersistenceError, wrap } from "@/shared/domain/PersistenceError"

import type { Commitment } from "@/modules/commitments/core/domain/Commitment"

export interface CommitmentRow {
  readonly id: string
  readonly household_id: string
  readonly kind: string
  readonly name: string
  readonly enabled: number
  readonly amount_cents: number | null
  readonly start_date: string | null
  readonly end_date: string | null
  readonly one_off_date: string | null
  readonly initial_amount_cents: number | null
  readonly interest_rate_basis_points: number | null
  readonly regular_payment_cents: number | null
  readonly tax_year: number | null
  readonly tax_status: string | null
  readonly person_id: string | null
}

export interface ScheduleRow {
  readonly commitment_id: string
  readonly date: string
  readonly amount_cents: number
}

const failed = (row: CommitmentRow) => wrap(`read the commitment ${row.id}`)

const cents = (row: CommitmentRow, value: number | null) =>
  Effect.fromResult(Money.fromCents(value ?? Number.NaN)).pipe(Effect.mapError(failed(row)))

const day = (row: CommitmentRow, value: string | null) =>
  Effect.fromResult(LocalDate.parse(value ?? "")).pipe(Effect.mapError(failed(row)))

const periodOf = (row: CommitmentRow) =>
  Effect.gen(function* () {
    const start = yield* day(row, row.start_date)
    const end = row.end_date === null ? undefined : yield* day(row, row.end_date)
    return yield* Effect.fromResult(ActivePeriod.make(start, end)).pipe(
      Effect.mapError(failed(row))
    )
  })

const shared = (row: CommitmentRow) => ({
  id: commitmentId(row.id),
  householdId: householdId(row.household_id),
  name: row.name,
  enabled: row.enabled === 1
})

const recurringExpense = (row: CommitmentRow) =>
  Effect.gen(function* () {
    return new RecurringExpense({
      ...shared(row),
      amount: yield* cents(row, row.amount_cents),
      period: yield* periodOf(row)
    })
  })

const oneOffExpense = (row: CommitmentRow) =>
  Effect.gen(function* () {
    return new OneOffExpense({
      ...shared(row),
      amount: yield* cents(row, row.amount_cents),
      date: yield* day(row, row.one_off_date)
    })
  })

const debt = (row: CommitmentRow) =>
  Effect.gen(function* () {
    return new Debt({
      ...shared(row),
      initialAmount: yield* cents(row, row.initial_amount_cents),
      interestRate: yield* Effect.fromResult(
        Percentage.fromStoredBasisPoints(row.interest_rate_basis_points ?? Number.NaN)
      ).pipe(Effect.mapError(failed(row))),
      regularPaymentAmount: yield* cents(row, row.regular_payment_cents),
      startDate: yield* day(row, row.start_date)
    })
  })

const statusOf = (row: CommitmentRow): Result.Result<TaxStatus, PersistenceError> =>
  row.tax_status === "confirmed" || row.tax_status === "estimated"
    ? Result.succeed(row.tax_status)
    : Result.fail(failed(row)(`unknown tax status ${String(row.tax_status)}`))

const taxLiability = (row: CommitmentRow, schedule: ReadonlyArray<ScheduleRow>) =>
  Effect.gen(function* () {
    return new TaxLiability({
      ...shared(row),
      taxYear: row.tax_year ?? undefined,
      status: yield* Effect.fromResult(statusOf(row)),
      amount: yield* cents(row, row.amount_cents),
      paymentSchedule: yield* Effect.all(
        schedule.map((payment) =>
          Effect.gen(function* () {
            return new ScheduledPayment({
              date: yield* Effect.fromResult(LocalDate.parse(payment.date)).pipe(
                Effect.mapError(failed(row))
              ),
              amount: yield* Effect.fromResult(Money.fromCents(payment.amount_cents)).pipe(
                Effect.mapError(failed(row))
              )
            })
          })
        )
      )
    })
  })

const recurringTaxPayment = (row: CommitmentRow) =>
  Effect.gen(function* () {
    return new RecurringTaxPayment({
      ...shared(row),
      personId: row.person_id === null ? undefined : personId(row.person_id),
      amount: yield* cents(row, row.amount_cents),
      period: yield* periodOf(row)
    })
  })

export const commitmentOf = (
  row: CommitmentRow,
  schedule: ReadonlyArray<ScheduleRow>
): Effect.Effect<Commitment, PersistenceError> => {
  switch (row.kind) {
    case "RecurringExpense":
      return recurringExpense(row)
    case "OneOffExpense":
      return oneOffExpense(row)
    case "Debt":
      return debt(row)
    case "TaxLiability":
      return taxLiability(row, schedule)
    case "RecurringTaxPayment":
      return recurringTaxPayment(row)
    default:
      return Effect.fail(failed(row)(`unknown commitment kind ${row.kind}`))
  }
}
