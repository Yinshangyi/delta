/**
 * OPFS is evictable. A browser under storage pressure may delete the database,
 * and Delta's data is hand-entered with nothing upstream to restore it from —
 * so the app asks to be marked persistent, and tells the user when it is not.
 *
 * This is half the durability story; export to a file is the other half, and
 * neither is optional.
 */
import { Context, type Effect } from "effect"

export interface StorageEstimate {
  /** Bytes the origin is using, when the browser is willing to say. */
  readonly usedBytes: number | undefined
  readonly quotaBytes: number | undefined
}

export interface StorageDurability {
  /**
   * Asks the browser to exempt this origin from eviction. Browsers decide by
   * their own rules — engagement, installation, existing permissions — so a
   * refusal is an ordinary answer, not an error.
   */
  readonly request: Effect.Effect<boolean>
  readonly isPersisted: Effect.Effect<boolean>
  readonly estimate: Effect.Effect<StorageEstimate>
}

export const StorageDurability = Context.Service<StorageDurability>(
  "delta/bootstrap/StorageDurability"
)
