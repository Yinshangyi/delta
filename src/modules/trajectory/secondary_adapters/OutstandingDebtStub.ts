/** A canned outstanding balance, for the net-worth read model. */
import { Effect, Layer } from "effect"

import {
  OutstandingDebt,
  type OutstandingDebtShape
} from "@/modules/trajectory/core/ports/secondary/OutstandingDebt"
import * as Money from "@/shared/domain/Money"

export interface OutstandingDebtStubOptions {
  readonly total?: Money.Money
}

export const makeOutstandingDebtStub = (options: OutstandingDebtStubOptions = {}) => {
  const total = options.total ?? Money.zero
  const shape: OutstandingDebtShape = { total: Effect.succeed(total) }

  return { layer: Layer.succeed(OutstandingDebt)(shape) }
}
