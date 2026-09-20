/**
 * Capital minus what is still owed (spec §77, CAP-11).
 *
 * **A display figure, and only that.** It never reaches the engine — the
 * engine's starting balance comes from `CapitalSources`, and subtracting debt
 * there would count it twice, since the debt already arrives as scheduled cash
 * flows (§22). The two figures live behind two different ports so that mistake
 * has no shape to take.
 *
 * Capital stays the headline because capital is what drives the target date.
 * Net worth is the honest present position beside it.
 */
import { Data, Effect } from "effect"

import { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import { OutstandingDebt } from "@/modules/trajectory/core/ports/secondary/OutstandingDebt"
import * as Money from "@/shared/domain/Money"

import type * as LocalDate from "@/shared/domain/LocalDate"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export class NetWorth extends Data.Class<{
  readonly capital: Money.Money
  readonly outstandingDebt: Money.Money
  readonly netWorth: Money.Money
}> {}

export const netWorthAt = (
  on: LocalDate.LocalDate
): Effect.Effect<
  NetWorth,
  PersistenceError,
  typeof CapitalSources.Identifier | typeof OutstandingDebt.Identifier
> =>
  Effect.gen(function* () {
    const capitalSources = yield* CapitalSources
    const debts = yield* OutstandingDebt

    const capital = yield* capitalSources.totalAt(on)
    const outstandingDebt = yield* debts.total

    return new NetWorth({
      capital,
      outstandingDebt,
      netWorth: Money.subtract(capital, outstandingDebt)
    })
  })
