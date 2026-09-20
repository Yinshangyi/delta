/**
 * A valuation has to have happened (CAP-04).
 *
 * A balance dated next week is a typo, not a forecast — and one accepted
 * quietly is worse than one refused, because the holding then reads as having
 * no value at all while the figure sits in the database.
 *
 * Shared by adding a holding and recording against one, so the two cannot
 * disagree about what a valid date is.
 */
import { Data, Result } from "effect"

import * as LocalDate from "@/shared/domain/LocalDate"

export class ValuationInTheFuture extends Data.TaggedError("ValuationInTheFuture")<{
  readonly date: LocalDate.LocalDate
  readonly today: LocalDate.LocalDate
}> {}

export const validate = (
  date: LocalDate.LocalDate,
  today: LocalDate.LocalDate
): Result.Result<LocalDate.LocalDate, ValuationInTheFuture> =>
  LocalDate.isAfter(date, today)
    ? Result.fail(new ValuationInTheFuture({ date, today }))
    : Result.succeed(date)
