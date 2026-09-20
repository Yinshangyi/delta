/**
 * When something runs: a start, and an end that may not have arrived.
 *
 * Shared rather than owned by either module because income and commitments ask
 * the identical question of it — "is this running in month M" — and two copies
 * of that answer would drift on the same edge cases: the month a thing starts
 * part-way through, and what an absent end date means.
 *
 * An absent end means "until further notice", never "forever". What bounds an
 * open-ended period is the horizon the caller asks for.
 */
import { Data, Result } from "effect"

import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"

export class ActivePeriod extends Data.Class<{
  readonly startDate: LocalDate.LocalDate
  readonly endDate: LocalDate.LocalDate | undefined
}> {}

export class InvalidPeriod extends Data.TaggedError("InvalidPeriod")<{
  readonly startDate: LocalDate.LocalDate
  readonly endDate: LocalDate.LocalDate
}> {}

/**
 * A period that ends before it starts produces nothing at all, which on screen
 * is indistinguishable from something merely switched off. Refused here so the
 * mistake is reported where it was made.
 */
export const make = (
  startDate: LocalDate.LocalDate,
  endDate: LocalDate.LocalDate | undefined
): Result.Result<ActivePeriod, InvalidPeriod> =>
  endDate !== undefined && LocalDate.isBefore(endDate, startDate)
    ? Result.fail(new InvalidPeriod({ startDate, endDate }))
    : Result.succeed(new ActivePeriod({ startDate, endDate }))

/** A month counts when the period is running for any part of it. */
export const includes = (period: ActivePeriod, month: YearMonth.YearMonth): boolean => {
  if (YearMonth.isBefore(month, LocalDate.toYearMonth(period.startDate))) return false
  if (period.endDate === undefined) return true
  return YearMonth.isOnOrBefore(month, LocalDate.toYearMonth(period.endDate))
}

export const monthsIn = (
  period: ActivePeriod,
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
): ReadonlyArray<YearMonth.YearMonth> =>
  YearMonth.range(from, to).filter((month) => includes(period, month))
