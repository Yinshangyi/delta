/**
 * Money as text. Pure, so a formatting decision is a unit test rather than a
 * screenshot (design-brief.md — Formatting conventions).
 */
import * as Money from "@/shared/domain/Money"
import { CURRENCY, LOCALE } from "@/shared/presentation/Locale"

const whole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const withCents = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

/**
 * `€1,280`, and `€1,280.50` only when the cents are non-zero — a column of
 * round figures should not carry `.00` twice per row.
 */
export const money = (amount: Money.Money): string =>
  (Money.toCents(amount) % 100 === 0 ? whole : withCents).format(Money.toEuros(amount))

/**
 * An estimate, marked twice: `~` and — at the call site — a label. The tilde
 * alone is too quiet to carry the meaning, so it is never the only signal.
 */
export const estimated = (amount: Money.Money): string => `~${money(amount)}`
