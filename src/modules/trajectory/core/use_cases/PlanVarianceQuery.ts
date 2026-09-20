/**
 * Are we ahead of or behind what was forecast? (TRJ-10, TRJ-05)
 *
 * The comparison is made against Delta's own earlier forecast rather than a
 * stored one: take the capital reading before last, project forward from it,
 * and see what it said this month would hold. Nothing has to be written down
 * in advance, and the answer cannot drift out of step with the engine, because
 * it *is* the engine.
 *
 * `Option.none` where there is nothing to compare against — one reading, or
 * two in the same month — which the screen says rather than showing a zero
 * variance that looks like being exactly on plan.
 */
import { Effect, Option } from "effect"

import { compare, type PlanVariance } from "@/modules/trajectory/core/domain/PlanVariance"
import { project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import { CashFlowSources } from "@/modules/trajectory/core/ports/secondary/CashFlowSources"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { ProjectionResult } from "@/modules/trajectory/core/domain/ProjectionResult"
import type * as CashFlow from "@/shared/domain/CashFlow"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

/**
 * A recorded balance already contains everything that had happened by its
 * date, so projecting forward must not replay those flows. Delta dates
 * recurring flows on the last day of a month, so a reading taken on the 31st
 * comes after that month's income and a reading on the 15th comes before it —
 * which the date comparison gets right either way, and a month-granular rule
 * would not.
 */
const after = (
  flows: ReadonlyArray<CashFlow.CashFlow>,
  reading: LocalDate.LocalDate
): ReadonlyArray<CashFlow.CashFlow> => flows.filter((flow) => LocalDate.isAfter(flow.date, reading))

const targetMonthOf = (result: ProjectionResult): YearMonth.YearMonth | undefined =>
  result.months.find((month) =>
    Money.isGreaterThanOrEqualTo(month.endingSavings, result.targetAmount)
  )?.month

/**
 * The latest reading, and the latest one from an *earlier month* to compare it
 * against.
 *
 * Not simply the last two: correcting a balance mid-month would then leave the
 * household with nothing to compare against until the following month, which
 * is exactly when they have just been looking at their figures.
 */
const toCompare = (
  dates: ReadonlyArray<LocalDate.LocalDate>
): readonly [LocalDate.LocalDate, LocalDate.LocalDate] | undefined => {
  const ordered = [...dates].sort(LocalDate.Order)
  const latest = ordered.at(-1)
  if (latest === undefined) return undefined

  const latestMonth = LocalDate.toYearMonth(latest)
  const previous = ordered
    .filter((date) => YearMonth.isBefore(LocalDate.toYearMonth(date), latestMonth))
    .at(-1)

  return previous === undefined ? undefined : [previous, latest]
}

export const planVariance: Effect.Effect<
  Option.Option<PlanVariance>,
  PersistenceError,
  typeof Goals.Identifier | typeof CapitalSources.Identifier | typeof CashFlowSources.Identifier
> = Effect.gen(function* () {
  const goals = yield* Goals
  const goal = yield* goals.enabled
  if (Option.isNone(goal)) return Option.none()

  const capital = yield* CapitalSources
  const pair = toCompare(yield* capital.recordedDates)
  if (pair === undefined) return Option.none()

  const [previous, latest] = pair
  const from = LocalDate.toYearMonth(previous)
  const until = LocalDate.toYearMonth(latest)

  const sources = yield* CashFlowSources
  const target = goal.value.targetAmount

  /** What the forecast made before this reading said today would hold. */
  const forecast = project({
    cashFlows: after(yield* sources.between(from, YearMonth.addMonths(from, 600)), previous),
    startingCapital: yield* capital.totalAt(previous),
    target,
    from
  })

  const expected = forecast.months.find((month) => month.month === until)?.endingSavings
  if (expected === undefined) return Option.none()

  const actual = yield* capital.totalAt(latest)
  const revised = project({
    cashFlows: after(yield* sources.between(until, YearMonth.addMonths(until, 600)), latest),
    startingCapital: actual,
    target,
    from: until
  })

  return Option.some(compare(expected, actual, targetMonthOf(forecast), targetMonthOf(revised)))
})
