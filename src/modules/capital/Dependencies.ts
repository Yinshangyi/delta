/** What this module needs wiring (spec §53, FND-10). */
import { Layer } from "effect"

import { HoldingsLive } from "@/modules/capital/secondary_adapters/HoldingsLive"
import { ValuationHistoryLive } from "@/modules/capital/secondary_adapters/ValuationHistoryLive"

import type { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import type { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import type { SqlClient } from "effect/unstable/sql"

export const capitalAdaptersLayer: Layer.Layer<
  typeof Holdings.Identifier | typeof ValuationHistory.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.mergeAll(HoldingsLive, ValuationHistoryLive)
