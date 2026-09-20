/**
 * Scenario overrides applied to holdings (SCN-04).
 *
 * "What if we sold the watches?" costs no new machinery: the same exclusion
 * flag the Capital screen toggles, applied to a copy. Stored inclusion flags
 * and valuations are untouched.
 */
import { Match } from "effect"

import { BankAccount, PhysicalAsset, type Holding } from "@/modules/capital/core/domain/Holding"
import { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"
import { Valuation } from "@/modules/capital/core/domain/Valuation"

import type { ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"

const excluded = (holding: Holding): Holding =>
  Match.valueTags(holding, {
    BankAccount: (account) => new BankAccount({ ...account, includedInCapital: false }),
    PhysicalAsset: (asset) => new PhysicalAsset({ ...asset, includedInCapital: false })
  })

const changedHolding = (valued: ValuedHolding, override: ScenarioOverride): ValuedHolding =>
  Match.valueTags(override, {
    ExcludeHolding: (change) =>
      change.holdingId === valued.holding.id
        ? new ValuedHolding({ ...valued, holding: excluded(valued.holding) })
        : valued,
    ChangeHoldingValue: (change) =>
      change.holdingId === valued.holding.id
        ? new ValuedHolding({
            ...valued,
            valuation:
              valued.valuation === undefined
                ? undefined
                : new Valuation({ ...valued.valuation, amount: change.amount })
          })
        : valued,
    ChangeDailyRate: (): ValuedHolding => valued,
    ChangeBillableDays: (): ValuedHolding => valued,
    ChangePayoutRatio: (): ValuedHolding => valued,
    ChangeIncome: (): ValuedHolding => valued,
    AddHypotheticalExpense: (): ValuedHolding => valued,
    DisableCommitment: (): ValuedHolding => valued
  })

export const overriddenHoldings = (
  valued: ReadonlyArray<ValuedHolding>,
  overrides: ReadonlyArray<ScenarioOverride>
): ReadonlyArray<ValuedHolding> =>
  valued.map((holding) => overrides.reduce(changedHolding, holding))
