/**
 * Spec §56. The ISO string is the representation because ordering is
 * lexicographic, equality is ===, and SQLite stores it unchanged.
 */
import { Brand, Data, Order as Ord, Result } from "effect"
import { Temporal } from "temporal-polyfill"

export type YearMonth = Brand.Branded<string, "YearMonth">

export class InvalidYearMonth extends Data.TaggedError("InvalidYearMonth")<{
  readonly value: string | number
  readonly reason: "malformed" | "out-of-range"
}> {}

/** Temporal also accepts "2026-09-14" here; a month is a month. */
const PATTERN = /^\d{4}-\d{2}$/

const attempt = (
  value: string | number,
  build: () => Temporal.PlainYearMonth
): Result.Result<YearMonth, InvalidYearMonth> => {
  try {
    return Result.succeed(build().toString() as YearMonth)
    // Temporal's RangeError says which field was out of range; the `reason` enum
    // already carries that, and the domain error must not leak a library type.
    // ast-grep-ignore: no-unbound-catch
  } catch {
    return Result.fail(new InvalidYearMonth({ value, reason: "out-of-range" }))
  }
}

export const fromParts = (year: number, month: number) =>
  attempt(month, () => Temporal.PlainYearMonth.from({ year, month }, { overflow: "reject" }))

export const parse = (iso: string): Result.Result<YearMonth, InvalidYearMonth> =>
  PATTERN.test(iso)
    ? attempt(iso, () => Temporal.PlainYearMonth.from(iso))
    : Result.fail(new InvalidYearMonth({ value: iso, reason: "malformed" }))

const of = (yearMonth: YearMonth): Temporal.PlainYearMonth =>
  Temporal.PlainYearMonth.from(yearMonth)

export const toIso = (yearMonth: YearMonth): string => yearMonth

export const year = (yearMonth: YearMonth): number => Number(yearMonth.slice(0, 4))

export const month = (yearMonth: YearMonth): number => Number(yearMonth.slice(5, 7))

export const addMonths = (yearMonth: YearMonth, months: number): YearMonth =>
  of(yearMonth)
    .add({ months: Math.trunc(months) })
    .toString() as YearMonth

/** `until` defaults to a largestUnit of years, which would report 1y 2m as 2. */
export const monthsBetween = (from: YearMonth, to: YearMonth): number =>
  of(from).until(of(to), { largestUnit: "month" }).months

export const range = (from: YearMonth, to: YearMonth): ReadonlyArray<YearMonth> => {
  const span = monthsBetween(from, to)
  if (span < 0) return []
  return Array.from({ length: span + 1 }, (_, offset) => addMonths(from, offset))
}

export const daysInMonth = (yearMonth: YearMonth): number => of(yearMonth).daysInMonth

export const Order: Ord.Order<YearMonth> = Ord.String as Ord.Order<YearMonth>

export const equals = (a: YearMonth, b: YearMonth): boolean => a === b

export const isBefore = Ord.isLessThan(Order)
export const isAfter = Ord.isGreaterThan(Order)
