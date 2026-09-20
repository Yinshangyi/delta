/**
 * The household's whole contribution to the projection (spec §13, §29).
 *
 * This is one half of the cash-flow seam in architecture.md. Trajectory asks
 * for a date range and receives dated amounts; it never learns that a
 * freelancer bills by the day or that a salary is taxed.
 *
 * Adding an income source type means a new variant and a new branch in
 * `cashFlowsFor` — both inside this module, neither visible from outside it.
 */
import { Effect } from "effect"

import { cashFlowsFor } from "@/modules/household/core/domain/IncomeCashFlows"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"

import type * as CashFlow from "@/shared/domain/CashFlow"
import type { PersistenceError } from "@/shared/domain/PersistenceError"
import type * as YearMonth from "@/shared/domain/YearMonth"

export const householdCashFlowsBetween = (
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
): Effect.Effect<
  ReadonlyArray<CashFlow.CashFlow>,
  PersistenceError,
  typeof IncomeSources.Identifier
> =>
  Effect.gen(function* () {
    const sources = yield* IncomeSources
    const all = yield* sources.all
    return all.flatMap((source) => cashFlowsFor(source, from, to))
  })
