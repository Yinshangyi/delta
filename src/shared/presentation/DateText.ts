/**
 * Dates as text. Two shapes, deliberately different, because they answer
 * different questions: a target date is a month, a snapshot is a day.
 */
import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"
import { LOCALE } from "@/shared/presentation/Locale"

/**
 * `timeZone: "UTC"` is not decoration. Intl formats in the *runtime's* zone by
 * default, so a date built at UTC midnight renders as the previous day in Los
 * Angeles — reintroducing exactly the drift LocalDate exists to prevent.
 */
const monthFormat = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: "UTC"
})

const dayFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
})

/**
 * `Intl` takes a `Date`, which the domain refuses to hold. Building one here
 * from explicit UTC parts keeps the host timezone out of it: the same
 * YearMonth renders identically in Manila and Los Angeles.
 */
const utc = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day))

/** `October 2028` — target dates and chart labels. */
export const month = (value: YearMonth.YearMonth): string =>
  monthFormat.format(utc(YearMonth.year(value), YearMonth.month(value), 1))

/** `31 Oct 2026` — snapshots and scheduled payments. */
export const day = (value: LocalDate.LocalDate): string =>
  dayFormat.format(utc(LocalDate.year(value), LocalDate.month(value), LocalDate.day(value)))
