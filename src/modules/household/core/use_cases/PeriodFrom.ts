/**
 * An `<input type="date">` produces an ISO string or nothing at all, which is
 * exactly what a period is made of. Shared by both income use cases so the two
 * cannot drift on what an empty end date means.
 */
import { Effect } from "effect"

import * as IncomeSource from "@/modules/household/core/domain/IncomeSource"
import * as LocalDate from "@/shared/domain/LocalDate"

export const periodFrom = (
  startDate: string,
  endDate: string | undefined
): Effect.Effect<
  IncomeSource.ActivePeriod,
  LocalDate.InvalidLocalDate | IncomeSource.InvalidPeriod
> =>
  Effect.gen(function* () {
    const start = yield* Effect.fromResult(LocalDate.parse(startDate))
    const end =
      endDate === undefined || endDate === ""
        ? undefined
        : yield* Effect.fromResult(LocalDate.parse(endDate))
    return yield* Effect.fromResult(IncomeSource.activePeriod(start, end))
  })
