/**
 * What day it is, here.
 *
 * The domain holds no `Date` and has no timezone by design, so somewhere has
 * to translate the machine's clock into a `LocalDate` — and that somewhere is
 * the outermost edge, not a use case. Reading it here means every use case
 * below stays a pure function of its inputs and a test never needs fake time.
 */
import { Result } from "effect"

import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"

/** `sv-SE` renders an ISO date, which is exactly what `LocalDate` parses. */
const isoToday = (): string => new Date().toLocaleDateString("sv-SE")

export const today = (): LocalDate.LocalDate =>
  Result.getOrElse(LocalDate.parse(isoToday()), () =>
    Result.getOrThrow(LocalDate.fromParts(2000, 1, 1))
  )

export const thisMonth = (): YearMonth.YearMonth => LocalDate.toYearMonth(today())
