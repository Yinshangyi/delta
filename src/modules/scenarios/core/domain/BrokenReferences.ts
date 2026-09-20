/**
 * Overrides pointing at entities that no longer exist (SCN-10).
 *
 * A stale scenario must not quietly change its own answer. Dropping a broken
 * override and carrying on would do exactly that: "sell the watch" against a
 * watch that has been deleted becomes "change nothing", and the scenario goes
 * on reporting a delta that is now about something else entirely.
 *
 * So a broken reference is named, the scenario reports no delta until it is
 * repaired, and repairing it is the household's decision rather than Delta's.
 */
import { Data, Match } from "effect"

import { kindOf } from "@/modules/scenarios/core/domain/Scenario"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type {
  OverrideId,
  OverrideKind,
  Scenario,
  ScenarioOverride
} from "@/modules/scenarios/core/domain/Scenario"

export class BrokenReference extends Data.Class<{
  readonly override: OverrideId
  readonly kind: OverrideKind
  /** What it points at, for a message naming the thing rather than an id. */
  readonly missing: "income source" | "commitment" | "holding"
  readonly reference: string
}> {}

export interface LiveEntities {
  readonly incomeSources: ReadonlyArray<IncomeSourceId>
  readonly commitments: ReadonlyArray<CommitmentId>
  readonly holdings: ReadonlyArray<HoldingId>
}

const broken = (
  override: ScenarioOverride,
  missing: BrokenReference["missing"],
  reference: string
) =>
  new BrokenReference({
    override: override.id,
    kind: kindOf(override),
    missing,
    reference
  })

const unless = (present: boolean, make: () => BrokenReference): ReadonlyArray<BrokenReference> =>
  present ? [] : [make()]

const brokenBy = (
  override: ScenarioOverride,
  live: LiveEntities
): ReadonlyArray<BrokenReference> => {
  const income = (id: IncomeSourceId) =>
    unless(live.incomeSources.includes(id), () => broken(override, "income source", id))

  const holding = (id: HoldingId) =>
    unless(live.holdings.includes(id), () => broken(override, "holding", id))

  return Match.valueTags(override, {
    ChangeDailyRate: (change) => income(change.incomeSourceId),
    ChangeBillableDays: (change) => income(change.incomeSourceId),
    ChangePayoutRatio: (change) => income(change.incomeSourceId),
    ChangeIncome: (change) => income(change.incomeSourceId),
    DisableCommitment: (change) =>
      unless(live.commitments.includes(change.commitmentId), () =>
        broken(override, "commitment", change.commitmentId)
      ),
    ExcludeHolding: (change) => holding(change.holdingId),
    ChangeHoldingValue: (change) => holding(change.holdingId),
    /** Refers to nothing, so it cannot break. */
    AddHypotheticalExpense: (): ReadonlyArray<BrokenReference> => []
  })
}

export const brokenReferences = (
  scenario: Scenario,
  live: LiveEntities
): ReadonlyArray<BrokenReference> =>
  scenario.overrides.flatMap((override) => brokenBy(override, live))

export const isBroken = (scenario: Scenario, live: LiveEntities): boolean =>
  brokenReferences(scenario, live).length > 0
