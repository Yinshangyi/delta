/**
 * What the household actually had, on the dates they recorded it.
 *
 * The chart's solid segment (TRJ-07). Deliberately *not* a back-projection:
 * running the engine backwards would reconstruct history from today's
 * configuration, and drawing that as a solid line would present a
 * reconstruction as a record. These are the numbers the household typed in.
 */
import { Data, Effect } from "effect"

import { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import * as LocalDate from "@/shared/domain/LocalDate"

import type * as Money from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"
import type * as YearMonth from "@/shared/domain/YearMonth"

export class RecordedCapital extends Data.Class<{
  readonly month: YearMonth.YearMonth
  readonly amount: Money.Money
}> {}

export const recordedCapital: Effect.Effect<
  ReadonlyArray<RecordedCapital>,
  PersistenceError,
  typeof CapitalSources.Identifier
> = Effect.gen(function* () {
  const capital = yield* CapitalSources
  const dates = yield* capital.recordedDates

  const points: Array<RecordedCapital> = []
  for (const date of dates) {
    points.push(
      new RecordedCapital({
        month: LocalDate.toYearMonth(date),
        amount: yield* capital.totalAt(date)
      })
    )
  }

  /** One point per month: a month read twice keeps the later reading. */
  const byMonth = new Map(points.map((point) => [point.month, point]))
  return [...byMonth.values()]
})
