/**
 * What a form hands over: plain strings and numbers, judged once by the use
 * case rather than by a component.
 */
import type { HouseholdId } from "@/modules/household/core/domain/Household"

export interface BankAccountDraft {
  readonly kind: "BankAccount"
  readonly household: HouseholdId
  readonly name: string
  readonly institution: string | undefined
  /** Spec CAP-03: the opening balance is a valuation, recorded with the account. */
  readonly openingBalanceEuros: number
  readonly balanceDate: string
  readonly today: string
}

export interface PhysicalAssetDraft {
  readonly kind: "PhysicalAsset"
  readonly household: HouseholdId
  readonly name: string
  readonly category: string | undefined
  /** Net realisable proceeds, not a listing price and not what it cost (§78). */
  readonly resaleValueEuros: number
  readonly valuationDate: string
  readonly acquisitionCostEuros: number | undefined
  readonly acquisitionDate: string | undefined
  readonly today: string
}

export type HoldingDraft = BankAccountDraft | PhysicalAssetDraft
