/**
 * Write a scenario's changes into the real plan (SCN-08).
 *
 * The only place in the module that writes anything outside `scenarios`. Every
 * override becomes an ordinary edit through the same ports the screens use —
 * a dropped commitment is disabled exactly as the toggle disables it, an
 * excluded holding exactly as the Capital switch excludes it — so there is no
 * second way for configuration to change and nothing that can be applied here
 * but not undone there.
 *
 * A hypothetical purchase becomes a real one-off commitment, which is the only
 * override that creates rather than edits.
 */
import { Effect, Match } from "effect"

import { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import { basisOf } from "@/modules/capital/core/domain/Holding"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { OneOffExpense, commitmentId } from "@/modules/commitments/core/domain/Commitment"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { overriddenIncome } from "@/modules/scenarios/core/domain/OverrideIncome"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type {
  AddHypotheticalExpense,
  Scenario,
  ScenarioOverride
} from "@/modules/scenarios/core/domain/Scenario"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

type Ports =
  | typeof IncomeSources.Identifier
  | typeof Commitments.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier

/**
 * "The bag is worth €6,500" applied for real is a recorded valuation — the
 * same act as typing it into the Capital screen. Anything less would be an
 * override that vanished on apply, which is the failure this whole epic is
 * written against.
 */
const recordValue = (
  holding: HoldingId,
  amount: Money.Money,
  today: LocalDate.LocalDate
): Effect.Effect<void, PersistenceError, Ports> =>
  Effect.gen(function* () {
    const holdings = yield* Holdings
    const found = (yield* holdings.all).find((each) => each.id === holding)
    if (found === undefined) return

    const valuations = yield* ValuationHistory
    yield* valuations.record(
      new BalanceSnapshot({
        id: yield* valuations.nextId,
        holdingId: holding,
        date: today,
        amount,
        basis: basisOf(found)
      })
    )
  })

const addPurchase = (
  change: AddHypotheticalExpense,
  household: HouseholdId
): Effect.Effect<void, PersistenceError, Ports> =>
  Effect.gen(function* () {
    const commitments = yield* Commitments
    yield* commitments.save(
      new OneOffExpense({
        id: commitmentId(yield* commitments.nextId),
        householdId: household,
        name: change.name,
        amount: change.amount,
        date: change.date,
        enabled: true
      })
    )
  })

const applyOne = (
  override: ScenarioOverride,
  household: HouseholdId,
  today: LocalDate.LocalDate
): Effect.Effect<void, PersistenceError, Ports> =>
  Match.valueTags(override, {
    AddHypotheticalExpense: (change) => addPurchase(change, household),
    DisableCommitment: (change) =>
      Effect.gen(function* () {
        const commitments = yield* Commitments
        yield* commitments.setEnabled(change.commitmentId, false)
      }),
    ExcludeHolding: (change) =>
      Effect.gen(function* () {
        const holdings = yield* Holdings
        yield* holdings.setIncluded(change.holdingId, false)
      }),
    /*
      The income and holding-value changes edit an entity's own fields, so they
      go through the same rebuild the simulation uses — one description of what
      each override means, not two.
    */
    ChangeDailyRate: (change) => saveIncome(change),
    ChangeBillableDays: (change) => saveIncome(change),
    ChangePayoutRatio: (change) => saveIncome(change),
    ChangeIncome: (change) => saveIncome(change),
    ChangeHoldingValue: (change) => recordValue(change.holdingId, change.amount, today)
  })

const saveIncome = (override: ScenarioOverride): Effect.Effect<void, PersistenceError, Ports> =>
  Effect.gen(function* () {
    const sources = yield* IncomeSources
    const all = yield* sources.all
    const changed = overriddenIncome(all, [override])

    for (const [index, source] of changed.entries()) {
      if (source !== all[index]) yield* sources.save(source)
    }
  })

export const applyScenario = (
  scenario: Scenario,
  today: LocalDate.LocalDate
): Effect.Effect<void, PersistenceError, Ports> =>
  Effect.gen(function* () {
    for (const override of scenario.overrides) {
      yield* applyOne(override, scenario.householdId, today)
    }
  })
