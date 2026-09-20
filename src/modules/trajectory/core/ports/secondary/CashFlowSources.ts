/**
 * Every dated amount the projection should account for, from wherever it came
 * (architecture.md — the first seam; spec §29).
 *
 * One port, one question. Trajectory asks for a date range and receives dated
 * amounts; it never learns that freelancers bill by the day or that tax
 * arrives on an uneven schedule. Adding rental income means one new translator
 * inside `household` and nothing here.
 *
 * It is a *port* rather than a direct call so a scenario can supply a second
 * implementation that wraps the live one and applies overrides — which is what
 * makes time cost a diff of two runs of the same code (§36).
 */
import { Context, type Effect } from "effect"

import type * as CashFlow from "@/shared/domain/CashFlow"
import type { PersistenceError } from "@/shared/domain/PersistenceError"
import type * as YearMonth from "@/shared/domain/YearMonth"

export interface CashFlowSourcesShape {
  readonly between: (
    from: YearMonth.YearMonth,
    to: YearMonth.YearMonth
  ) => Effect.Effect<ReadonlyArray<CashFlow.CashFlow>, PersistenceError>
}

export const CashFlowSources = Context.Service<CashFlowSourcesShape>(
  "delta/trajectory/CashFlowSources"
)
