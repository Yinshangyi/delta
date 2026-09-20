/**
 * Add an account or an asset, with its first valuation (CAP-03, CAP-05).
 *
 * The two are one use case because they are the same act from the person's
 * side — "we have this, and it is worth that" — and because the valuation must
 * be written with the holding rather than after it: a holding with no value is
 * a holding that silently contributes zero.
 *
 * Both are included in capital by default. The question the inclusion flag
 * answers — "how far are we if we don't count the watches?" — is one someone
 * asks later, about something already recorded.
 */
import { Effect } from "effect"

import { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import { BankAccount, basisOf, PhysicalAsset } from "@/modules/capital/core/domain/Holding"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { Holding, HoldingId } from "@/modules/capital/core/domain/Holding"
import type { HoldingDraft } from "@/modules/capital/core/use_cases/HoldingDrafts"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export type InvalidHolding = Money.InvalidMoney | LocalDate.InvalidLocalDate

const optionalEuros = (euros: number | undefined) =>
  euros === undefined
    ? Effect.succeed(undefined)
    : Effect.fromResult(Money.fromEuros(euros)).pipe(Effect.map((value) => value))

const optionalDay = (iso: string | undefined) =>
  iso === undefined || iso === ""
    ? Effect.succeed(undefined)
    : Effect.fromResult(LocalDate.parse(iso)).pipe(Effect.map((value) => value))

const holdingFrom = (id: HoldingId, draft: HoldingDraft): Effect.Effect<Holding, InvalidHolding> =>
  draft.kind === "BankAccount"
    ? Effect.succeed(
        new BankAccount({
          id,
          householdId: draft.household,
          name: draft.name.trim(),
          institution: draft.institution?.trim() === "" ? undefined : draft.institution,
          includedInCapital: true,
          enabled: true
        })
      )
    : Effect.gen(function* () {
        return new PhysicalAsset({
          id,
          householdId: draft.household,
          name: draft.name.trim(),
          category: draft.category?.trim() === "" ? undefined : draft.category,
          acquisitionCost: yield* optionalEuros(draft.acquisitionCostEuros),
          acquisitionDate: yield* optionalDay(draft.acquisitionDate),
          includedInCapital: true,
          enabled: true
        })
      })

const openingOf = (draft: HoldingDraft) =>
  draft.kind === "BankAccount"
    ? { euros: draft.openingBalanceEuros, on: draft.balanceDate }
    : { euros: draft.resaleValueEuros, on: draft.valuationDate }

export const addHolding = (
  draft: HoldingDraft
): Effect.Effect<
  Holding,
  InvalidHolding | PersistenceError,
  typeof Holdings.Identifier | typeof ValuationHistory.Identifier
> =>
  Effect.gen(function* () {
    const opening = openingOf(draft)
    const amount = yield* Effect.fromResult(Money.fromEuros(opening.euros))
    const date = yield* Effect.fromResult(LocalDate.parse(opening.on))

    const holdings = yield* Holdings
    const holding = yield* holdingFrom(yield* holdings.nextId, draft)
    yield* holdings.save(holding)

    const valuations = yield* ValuationHistory
    yield* valuations.record(
      new BalanceSnapshot({
        id: yield* valuations.nextId,
        holdingId: holding.id,
        date,
        amount,
        basis: basisOf(holding)
      })
    )

    return holding
  })
