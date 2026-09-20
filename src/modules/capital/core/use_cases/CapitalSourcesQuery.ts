/**
 * Total capital at a date — the one question the projection asks of this
 * module (spec §73, architecture.md's second seam).
 *
 * The engine receives a starting balance and nothing else. It never learns
 * that bank accounts and watches are different things, which is what makes an
 * investment account in V2 a new variant here and no change there.
 *
 * **Gross.** Outstanding debt is not subtracted, and cannot be: this module
 * has no way to see it (spec §77, CAP-10).
 */
import { Effect } from "effect"

import { totalOf, valueHoldings } from "@/modules/capital/core/domain/TotalCapital"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"

import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const totalCapitalAt = (
  on: LocalDate.LocalDate
): Effect.Effect<
  Money.Money,
  PersistenceError,
  typeof Holdings.Identifier | typeof ValuationHistory.Identifier
> =>
  Effect.gen(function* () {
    const holdings = yield* Holdings
    const valuations = yield* ValuationHistory
    return totalOf(valueHoldings(yield* holdings.all, yield* valuations.all, on))
  })
