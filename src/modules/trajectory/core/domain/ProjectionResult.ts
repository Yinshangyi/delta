/**
 * What a projection is, once it has run (spec §31, §32).
 *
 * One deviation from §31, for the same reason architecture.md gives elsewhere:
 * no `goalId`. The engine is handed a target amount, not a goal — it is what
 * lets the scenario comparison run the same code twice against two different
 * numbers — and the use case that asked pairs the result back with the goal it
 * asked about.
 */
import { Data } from "effect"

import type * as CashFlow from "@/shared/domain/CashFlow"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"
import type * as YearMonth from "@/shared/domain/YearMonth"

export class ProjectionMonth extends Data.Class<{
  readonly month: YearMonth.YearMonth
  readonly startingSavings: Money.Money
  readonly income: Money.Money
  readonly commitments: Money.Money
  readonly netCashFlow: Money.Money
  readonly endingSavings: Money.Money
  /** Spec §31: the month reports the flows that produced it, not just a total. */
  readonly cashFlows: ReadonlyArray<CashFlow.CashFlow>
}> {}

export class Reachable extends Data.TaggedClass("Reachable")<{
  readonly targetDate: LocalDate.LocalDate
  readonly monthsRemaining: number
}> {}

/**
 * `flows-exhausted` is a proof, not a guess: past the last dated flow the net
 * is zero forever, so the balance cannot move again. `horizon` is the guard
 * for everything else — the answer is "not within 50 years", which is not the
 * same statement and should not be dressed up as one.
 */
export class NotReachable extends Data.TaggedClass("NotReachable")<{
  readonly reason: "flows-exhausted" | "horizon"
}> {}

export type ProjectionStatus = Reachable | NotReachable

export class ProjectionResult extends Data.Class<{
  readonly startingSavings: Money.Money
  readonly targetAmount: Money.Money
  readonly status: ProjectionStatus
  readonly months: ReadonlyArray<ProjectionMonth>
}> {}
