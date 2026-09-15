import { LOCALE } from "@/shared/presentation/Locale"

const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const

/**
 * `1.2 MB`. Storage figures are for orientation, not accounting — one decimal
 * is enough, and the unit changes rather than the number growing to eight
 * digits.
 */
export const bytes = (count: number): string => {
  const step = Math.min(Math.floor(Math.log(Math.max(count, 1)) / Math.log(1024)), UNITS.length - 1)
  const scaled = count / 1024 ** step
  return new Intl.NumberFormat(LOCALE, {
    style: "unit",
    unit: UNITS[step],
    unitDisplay: "short",
    maximumFractionDigits: step === 0 ? 0 : 1
  }).format(scaled)
}
