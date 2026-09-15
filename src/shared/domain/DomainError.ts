/**
 * The catalogue spec §54 asks for, in one place so a reader can see the whole
 * failure vocabulary without opening nine files.
 *
 * Each error stays defined next to the type it guards — an error is part of a
 * constructor's contract, not a separate concern — and is re-exported here.
 * The three below have no constructor yet: the aggregates they belong to
 * arrive with CMT-04, CMT-06 and TRJ-01.
 */
import { Data } from "effect"

export { InvalidBillableDays } from "@/shared/domain/BillableDays"
export { InvalidDailyRate } from "@/shared/domain/DailyRate"
export { InvalidLocalDate } from "@/shared/domain/LocalDate"
export { InvalidMoney } from "@/shared/domain/Money"
export { InvalidPayoutRatio } from "@/shared/domain/PayoutRatio"
export { InvalidPercentage } from "@/shared/domain/Percentage"
export { PersistenceError } from "@/shared/domain/PersistenceError"
export { InvalidYearMonth } from "@/shared/domain/YearMonth"

/** A debt cannot owe less than nothing, and a payment cannot exceed the balance. */
export class InvalidDebtBalance extends Data.TaggedError("InvalidDebtBalance")<{
  readonly value: number
  readonly reason: "negative" | "payment-exceeds-balance"
}> {}

/** A schedule that never terminates would make the projection loop (spec §32). */
export class InvalidPaymentSchedule extends Data.TaggedError("InvalidPaymentSchedule")<{
  readonly reason: "ends-before-it-starts" | "non-positive-payment" | "never-amortises"
}> {}

export class InvalidGoal extends Data.TaggedError("InvalidGoal")<{
  readonly reason: "not-positive" | "already-reached" | "no-target-date"
}> {}
