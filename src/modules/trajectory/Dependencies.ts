/**
 * What this module needs wiring (spec §53, FND-10).
 *
 * The projection engine is not here: it is a pure function, so there is no
 * implementation to choose and nothing to provide.
 */
import { Layer } from "effect"

import { GoalsLive } from "@/modules/trajectory/secondary_adapters/GoalsLive"

import type { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import type { SqlClient } from "effect/unstable/sql"

export const trajectoryAdaptersLayer: Layer.Layer<
  typeof Goals.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.mergeAll(GoalsLive)
