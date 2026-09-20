/**
 * Canned cash flows, so a projection can be tested without a household, a
 * commitment or a database.
 *
 * This is the port's whole point made concrete (TRJ-03): trajectory names what
 * it needs, and what supplies it is a choice made elsewhere. The same
 * substitution is what a scenario will use to apply overrides (spec §35).
 */
import { Effect, Layer } from "effect"

import {
  CashFlowSources,
  type CashFlowSourcesShape
} from "@/modules/trajectory/core/ports/secondary/CashFlowSources"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as YearMonth from "@/shared/domain/YearMonth"

export interface CashFlowSourcesStubOptions {
  readonly flows?: ReadonlyArray<CashFlow.CashFlow>
}

export const makeCashFlowSourcesStub = (options: CashFlowSourcesStubOptions = {}) => {
  const flows = options.flows ?? []
  let asked: Array<{ readonly from: YearMonth.YearMonth; readonly to: YearMonth.YearMonth }> = []

  const shape: CashFlowSourcesShape = {
    between: (from, to) =>
      Effect.sync(() => {
        asked = [...asked, { from, to }]
        return flows.filter((flow) => {
          const month = CashFlow.monthOf(flow)
          return !YearMonth.isBefore(month, from) && !YearMonth.isAfter(month, to)
        })
      })
  }

  return { layer: Layer.succeed(CashFlowSources)(shape), inspect: () => ({ asked }) }
}
