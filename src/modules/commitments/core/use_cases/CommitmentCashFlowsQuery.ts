/**
 * Every outflow the household has committed to, as dated amounts (spec §17,
 * §29).
 *
 * The other half of the cash-flow seam in architecture.md. Trajectory asks for
 * a date range and receives negative amounts; it never learns that debts
 * amortise or that tax arrives on an uneven schedule. Adding a commitment type
 * means a new variant and a new branch in `cashFlowsFor` — both inside this
 * module, neither visible from outside it.
 */
import { Effect } from "effect"

import { cashFlowsFor } from "@/modules/commitments/core/domain/CommitmentCashFlows"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { positionsOf } from "@/modules/commitments/core/use_cases/DebtPositionsQuery"

import type * as CashFlow from "@/shared/domain/CashFlow"
import type { PersistenceError } from "@/shared/domain/PersistenceError"
import type * as YearMonth from "@/shared/domain/YearMonth"

export const commitmentCashFlowsBetween = (
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
): Effect.Effect<
  ReadonlyArray<CashFlow.CashFlow>,
  PersistenceError,
  typeof Commitments.Identifier | typeof DebtHistory.Identifier
> =>
  Effect.gen(function* () {
    const commitments = yield* Commitments
    const history = yield* DebtHistory
    const all = yield* commitments.all
    const positions = positionsOf(all, yield* history.all)

    return all.flatMap((commitment) => cashFlowsFor(commitment, positions, from, to))
  })
