/**
 * Everything the capital screen shows in one read: each holding with its
 * latest valuation, grouped by kind, and the total.
 *
 * Accounts and assets are separated here rather than in a component because
 * they are different kinds of fact (CAP-08) — one is a statement, the other a
 * guess — and the grouping is an answer about the domain, not a layout choice.
 */
import { Data, Effect, Match } from "effect"

import { totalOf, valueHoldings } from "@/modules/capital/core/domain/TotalCapital"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"

import type { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import type { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export class CapitalOverview extends Data.Class<{
  readonly accounts: ReadonlyArray<ValuedHolding>
  readonly assets: ReadonlyArray<ValuedHolding>
  readonly total: Money.Money
  readonly history: ReadonlyArray<BalanceSnapshot>
}> {}

const isAccount = (valued: ValuedHolding): boolean =>
  Match.valueTags(valued.holding, {
    BankAccount: () => true,
    PhysicalAsset: () => false
  })

export const capitalOverviewAt = (
  on: LocalDate.LocalDate
): Effect.Effect<
  CapitalOverview,
  PersistenceError,
  typeof Holdings.Identifier | typeof ValuationHistory.Identifier
> =>
  Effect.gen(function* () {
    const holdings = yield* Holdings
    const valuations = yield* ValuationHistory
    const history = yield* valuations.all
    const valued = valueHoldings(yield* holdings.all, history, on)

    return new CapitalOverview({
      accounts: valued.filter(isAccount),
      assets: valued.filter((each) => !isAccount(each)),
      total: totalOf(valued),
      history
    })
  })
