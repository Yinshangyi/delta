/**
 * The composition root. Every layer the application needs is assembled here
 * and nowhere else (spec §53).
 *
 * As each module lands it exports two layers from its own `Dependencies.ts` —
 * `<module>AdaptersLayer` (driven adapters over the database) and
 * `<module>UseCasesLayer` (interactors over those ports) — and gets merged in
 * below. Modules never build layers at the point of use.
 *
 * `makeAppLayer` takes persistence as a parameter rather than importing it, so
 * a test swaps the whole database for the in-memory one by calling it with a
 * different argument. That is the same seam the desktop build would use.
 */
import { Layer } from "effect"

import { DatabaseLive } from "@/bootstrap/persistence/Database"
import { ensureDurableStorage } from "@/bootstrap/persistence/EnsureDurableStorage"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { StorageDurabilityLive } from "@/bootstrap/persistence/StorageDurabilityLive"
import { householdAdaptersLayer } from "@/modules/household/Dependencies"
import { trajectoryAdaptersLayer } from "@/modules/trajectory/Dependencies"

import type { StorageDurability } from "@/bootstrap/persistence/StorageDurability"
import type { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import type { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import type { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import type { Migrator, SqlClient, SqlError } from "effect/unstable/sql"

export type PersistenceLayer = Layer.Layer<SqlClient.SqlClient, SqlError.SqlError>

export type AppServices =
  | SqlClient.SqlClient
  | StorageDurability
  | typeof HouseholdConfiguration.Identifier
  | typeof IncomeSources.Identifier
  | typeof Goals.Identifier

/** Building the app can fail two ways: no database, or a migration that did not apply. */
export type AppLayerError = SqlError.SqlError | Migrator.MigrationError

export const makeAppLayer = (
  persistence: PersistenceLayer,
  durability: Layer.Layer<StorageDurability> = StorageDurabilityLive
): Layer.Layer<AppServices, AppLayerError> => {
  const persisted = MigrationsLive.pipe(Layer.provideMerge(persistence))
  const modules = Layer.mergeAll(householdAdaptersLayer, trajectoryAdaptersLayer).pipe(
    Layer.provide(persisted)
  )
  const services = Layer.mergeAll(persisted, durability, modules)

  /**
   * Asking for durable storage is a startup step, not a screen: it has to
   * happen on first run whether or not anyone opens Settings. It cannot fail,
   * so it cannot stop the runtime from building.
   */
  return Layer.effectDiscard(ensureDurableStorage).pipe(Layer.provideMerge(services))
}

export const AppLayerLive: Layer.Layer<AppServices, AppLayerError> = makeAppLayer(DatabaseLive)
