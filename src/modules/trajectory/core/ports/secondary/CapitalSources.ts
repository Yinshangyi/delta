/**
 * The projection's starting balance (architecture.md — the second seam; spec
 * §73).
 *
 * One question, mirroring `CashFlowSources`. The engine receives a number and
 * never learns that bank accounts and watches are different things.
 *
 * **Gross** (§77). What this returns is the sum of included holdings, with no
 * debt netted off — debt already arrives through `CashFlowSources` as
 * scheduled payments.
 */
import { Context, type Effect } from "effect"

import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface CapitalSourcesShape {
  readonly totalAt: (on: LocalDate.LocalDate) => Effect.Effect<Money.Money, PersistenceError>
}

export const CapitalSources = Context.Service<CapitalSourcesShape>(
  "delta/trajectory/CapitalSources"
)
