/**
 * What this module needs wiring, in one place (spec §53, FND-10).
 *
 * There is no `householdUseCasesLayer`: Delta's use cases are exported
 * `Effect`s rather than services — "don't over-port" in architecture.md — so
 * there is nothing to provide. Only the driven adapters need a layer, because
 * only they have an implementation to choose.
 */
import { Layer } from "effect"

import { HouseholdConfigurationLive } from "@/modules/household/secondary_adapters/HouseholdConfigurationLive"
import { IncomeSourcesLive } from "@/modules/household/secondary_adapters/IncomeSourcesLive"

import type { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import type { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import type { SqlClient } from "effect/unstable/sql"

export const householdAdaptersLayer: Layer.Layer<
  typeof HouseholdConfiguration.Identifier | typeof IncomeSources.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.mergeAll(HouseholdConfigurationLive, IncomeSourcesLive)
