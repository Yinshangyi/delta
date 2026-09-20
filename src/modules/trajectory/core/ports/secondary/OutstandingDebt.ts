/**
 * What the household still owes, for the net-worth read model alone (spec
 * §77, CAP-11).
 *
 * Deliberately separate from `CapitalSources`, and deliberately never read by
 * the projection. Two ports rather than one field on the first is the point:
 * there is no shape of this code in which the engine can reach the number and
 * subtract it, which is the mistake §77 exists to prevent.
 */
import { Context, type Effect } from "effect"

import type * as Money from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface OutstandingDebtShape {
  readonly total: Effect.Effect<Money.Money, PersistenceError>
}

export const OutstandingDebt = Context.Service<OutstandingDebtShape>(
  "delta/trajectory/OutstandingDebt"
)
