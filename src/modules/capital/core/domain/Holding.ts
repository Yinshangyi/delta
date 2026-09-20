/**
 * Anything the household owns that counts toward the goal (spec §68).
 *
 * The same tagged-union shape as `IncomeSource` and `FinancialCommitment`, for
 * the same reason: an investment account or a vehicle is a new variant here
 * and one branch in the valuation basis, with no change to the engine.
 *
 * **A holding has no intrinsic amount** (§69). What it is worth on a date
 * comes from its valuations, which is what lets §2.3 — reality overrides the
 * forecast — apply per holding rather than per household.
 */
import { Brand, Data, Match } from "effect"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"

export type HoldingId = Brand.Branded<string, "HoldingId">

export const holdingId = (value: string): HoldingId => value as HoldingId

export class BankAccount extends Data.TaggedClass("BankAccount")<{
  readonly id: HoldingId
  readonly householdId: HouseholdId
  readonly name: string
  readonly institution: string | undefined
  readonly includedInCapital: boolean
  readonly enabled: boolean
}> {}

export class PhysicalAsset extends Data.TaggedClass("PhysicalAsset")<{
  readonly id: HoldingId
  readonly householdId: HouseholdId
  readonly name: string
  readonly category: string | undefined
  /** Informational only. Never enters capital or the projection (spec §78). */
  readonly acquisitionCost: Money.Money | undefined
  readonly acquisitionDate: LocalDate.LocalDate | undefined
  readonly includedInCapital: boolean
  readonly enabled: boolean
}> {}

export type Holding = BankAccount | PhysicalAsset

export type HoldingKind = Holding["_tag"]

/**
 * Spec §71: a bank balance is a fact, an asset's resale value is a guess. The
 * basis follows from the kind rather than being chosen at the call site, so
 * the two cannot be mixed up by a form.
 */
export type ValuationBasis = "actual" | "estimated"

export const basisOf = (holding: Holding): ValuationBasis =>
  Match.valueTags(holding, {
    BankAccount: () => "actual" as const,
    PhysicalAsset: () => "estimated" as const
  })

export const kindOf = (holding: Holding): HoldingKind =>
  Match.valueTags(holding, {
    BankAccount: () => "BankAccount" as const,
    PhysicalAsset: () => "PhysicalAsset" as const
  })

/** Both conditions: excluded by choice (§72), or switched off entirely. */
export const countsTowardCapital = (holding: Holding): boolean =>
  holding.enabled && holding.includedInCapital
