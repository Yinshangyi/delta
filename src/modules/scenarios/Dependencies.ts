/** What this module needs wiring (spec §53, FND-10). */
import { Layer } from "effect"

import { ScenariosLive } from "@/modules/scenarios/secondary_adapters/ScenariosLive"

import type { Scenarios } from "@/modules/scenarios/core/ports/secondary/Scenarios"
import type { SqlClient } from "effect/unstable/sql"

export const scenariosAdaptersLayer: Layer.Layer<
  typeof Scenarios.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.mergeAll(ScenariosLive)
