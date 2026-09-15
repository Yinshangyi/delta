/**
 * The share of invoiced revenue that can reach personal cash (spec §9, §10).
 *
 * A `Percentage` that must be configurable and must never be hard-coded as a
 * universal rule — the current development assumption is 80%, and the spec is
 * explicit that it is an assumption.
 */
import { Brand, Data, Result } from "effect"

import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"

export type PayoutRatio = Brand.Branded<Percentage.Percentage, "PayoutRatio">

export class InvalidPayoutRatio extends Data.TaggedError("InvalidPayoutRatio")<{
  readonly value: number
  readonly reason: "out-of-range" | "sub-basis-point" | "not-finite"
}> {}

export const fromPercent = (percent: number): Result.Result<PayoutRatio, InvalidPayoutRatio> =>
  Result.match(Percentage.fromPercent(percent), {
    onFailure: (error) =>
      Result.fail(new InvalidPayoutRatio({ value: percent, reason: error.reason })),
    onSuccess: (percentage) => Result.succeed(percentage as PayoutRatio)
  })

/** The spec's current development assumption, stated once so it is findable. */
export const developmentAssumption: PayoutRatio = 8_000 as PayoutRatio

export const toPercentage = (ratio: PayoutRatio): Percentage.Percentage => ratio

/** Spec §9: EstimatedTransferable = RevenueHT × EstimatedPayoutRatio. */
export const applyTo = (revenue: Money.Money, ratio: PayoutRatio): Money.Money =>
  Percentage.applyTo(revenue, toPercentage(ratio))
