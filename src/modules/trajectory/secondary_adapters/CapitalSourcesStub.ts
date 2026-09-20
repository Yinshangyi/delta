/** A canned starting balance, for projecting without any holdings. */
import { Effect, Layer, Result } from "effect"

import {
  CapitalSources,
  type CapitalSourcesShape
} from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

export interface CapitalSourcesStubOptions {
  readonly total?: Money.Money
  /** Keyed by ISO date, for testing a comparison against an earlier reading. */
  readonly byDate?: ReadonlyMap<string, Money.Money>
}

export const makeCapitalSourcesStub = (options: CapitalSourcesStubOptions = {}) => {
  const total = options.total ?? Money.zero
  const byDate = options.byDate ?? new Map<string, Money.Money>()

  const shape: CapitalSourcesShape = {
    totalAt: (on) => Effect.succeed(byDate.get(LocalDate.toIso(on)) ?? total),
    recordedDates: Effect.succeed(
      [...byDate.keys()].sort().flatMap((iso) => {
        const parsed = Result.getOrUndefined(LocalDate.parse(iso))
        return parsed === undefined ? [] : [parsed]
      })
    )
  }

  return { layer: Layer.succeed(CapitalSources)(shape) }
}
