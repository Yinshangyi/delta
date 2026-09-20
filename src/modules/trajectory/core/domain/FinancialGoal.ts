/**
 * What the household is saving toward (spec §14).
 *
 * A name and an amount, both entered by the person. Nothing here has a default
 * — no seeded €150k, no assumed horizon — because a goal Delta invented would
 * be the one number the whole projection turns on that nobody chose.
 */
import { Brand, Data, Result } from "effect"

import * as Money from "@/shared/domain/Money"

import type { HouseholdId } from "@/modules/household/core/domain/Household"

export type FinancialGoalId = Brand.Branded<string, "FinancialGoalId">

export const financialGoalId = (value: string): FinancialGoalId => value as FinancialGoalId

export class InvalidGoal extends Data.TaggedError("InvalidGoal")<{
  readonly reason: "unnamed" | "not-positive"
}> {}

export class FinancialGoal extends Data.Class<{
  readonly id: FinancialGoalId
  readonly householdId: HouseholdId
  readonly name: string
  readonly targetAmount: Money.Money
  /** Several goals can exist; V1 projects toward the enabled one (§14). */
  readonly enabled: boolean
}> {}

/**
 * A goal of zero is reached before it is set, and a negative one can never be
 * reached at all — neither is a target, so both are refused rather than
 * projected toward.
 */
export const validate = (
  name: string,
  targetAmount: Money.Money
): Result.Result<{ readonly name: string; readonly targetAmount: Money.Money }, InvalidGoal> => {
  const trimmed = name.trim()
  if (trimmed === "") return Result.fail(new InvalidGoal({ reason: "unnamed" }))
  if (!Money.isPositive(targetAmount)) {
    return Result.fail(new InvalidGoal({ reason: "not-positive" }))
  }
  return Result.succeed({ name: trimmed, targetAmount })
}
