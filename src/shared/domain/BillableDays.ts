/**
 * Days invoiced in a month (spec §9). A whole number, because half a day is
 * not a unit anyone invoices, and at most 31 because a month has no more.
 */
import { Brand, Data, Result } from "effect"

export type BillableDays = Brand.Branded<number, "BillableDays">

export class InvalidBillableDays extends Data.TaggedError("InvalidBillableDays")<{
  readonly value: number
  readonly reason: "not-a-whole-number" | "out-of-range"
}> {}

const MAX_DAYS_IN_MONTH = 31

export const fromNumber = (days: number): Result.Result<BillableDays, InvalidBillableDays> => {
  if (!Number.isInteger(days)) {
    return Result.fail(new InvalidBillableDays({ value: days, reason: "not-a-whole-number" }))
  }
  if (days < 0 || days > MAX_DAYS_IN_MONTH) {
    return Result.fail(new InvalidBillableDays({ value: days, reason: "out-of-range" }))
  }
  return Result.succeed(days as BillableDays)
}

export const toNumber = (days: BillableDays): number => days

export const zero: BillableDays = 0 as BillableDays
