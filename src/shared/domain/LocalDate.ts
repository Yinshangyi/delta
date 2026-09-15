/**
 * Spec §56. The `Date` global appears nowhere — it is a timestamp in disguise,
 * and the same instant is 1 March in UTC and 28 February in Los Angeles.
 *
 * The ISO string is the representation because lexicographic order is
 * chronological, equality is ===, and SQLite stores it unchanged.
 */
import { Brand, Data, Order as Ord, Result } from "effect"
import { Temporal } from "temporal-polyfill"

import * as YearMonth from "@/shared/domain/YearMonth"

export type LocalDate = Brand.Branded<string, "LocalDate">

export class InvalidLocalDate extends Data.TaggedError("InvalidLocalDate")<{
  readonly value: string | number
  readonly reason: "malformed" | "not-a-calendar-date"
}> {}

/** Temporal also accepts "2026-09-14T10:00"; a date carries no time. */
const PATTERN = /^\d{4}-\d{2}-\d{2}$/

const attempt = (
  value: string | number,
  build: () => Temporal.PlainDate
): Result.Result<LocalDate, InvalidLocalDate> => {
  try {
    return Result.succeed(build().toString() as LocalDate)
    // Temporal's RangeError says which field was out of range; the `reason` enum
    // already carries that, and the domain error must not leak a library type.
    // ast-grep-ignore: no-unbound-catch
  } catch {
    return Result.fail(new InvalidLocalDate({ value, reason: "not-a-calendar-date" }))
  }
}

export const fromParts = (year: number, month: number, day: number) =>
  attempt(day, () => Temporal.PlainDate.from({ year, month, day }, { overflow: "reject" }))

export const parse = (iso: string): Result.Result<LocalDate, InvalidLocalDate> =>
  PATTERN.test(iso)
    ? attempt(iso, () => Temporal.PlainDate.from(iso))
    : Result.fail(new InvalidLocalDate({ value: iso, reason: "malformed" }))

const of = (date: LocalDate): Temporal.PlainDate => Temporal.PlainDate.from(date)

export const toIso = (date: LocalDate): string => date

/** Clamps to the last day of the target month, as a calendar does. */
export const addMonths = (date: LocalDate, months: number): LocalDate =>
  of(date)
    .add({ months: Math.trunc(months) })
    .toString() as LocalDate

export const toYearMonth = (date: LocalDate): YearMonth.YearMonth =>
  date.slice(0, 7) as YearMonth.YearMonth

export const lastDayOf = (yearMonth: YearMonth.YearMonth): LocalDate =>
  `${YearMonth.toIso(yearMonth)}-${String(YearMonth.daysInMonth(yearMonth)).padStart(2, "0")}` as LocalDate

export const Order: Ord.Order<LocalDate> = Ord.String as Ord.Order<LocalDate>

export const equals = (a: LocalDate, b: LocalDate): boolean => a === b

export const isBefore = Ord.isLessThan(Order)
export const isAfter = Ord.isGreaterThan(Order)
