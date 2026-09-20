/**
 * Somewhere to keep what the household is committed to paying.
 *
 * Named for intent rather than mechanism, amending spec §52's
 * `CommitmentRepository` (architecture.md — Naming).
 */
import { Context, Effect } from "effect"

import type { Commitment, CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface CommitmentsShape {
  readonly nextId: Effect.Effect<CommitmentId>
  readonly all: Effect.Effect<ReadonlyArray<Commitment>, PersistenceError>
  readonly forHousehold: (
    household: HouseholdId
  ) => Effect.Effect<ReadonlyArray<Commitment>, PersistenceError>
  readonly save: (commitment: Commitment) => Effect.Effect<void, PersistenceError>
  readonly setEnabled: (id: CommitmentId, enabled: boolean) => Effect.Effect<void, PersistenceError>
  /** Takes a debt's snapshots with it — the schema cascades (spec §28, CMT-10). */
  readonly remove: (id: CommitmentId) => Effect.Effect<void, PersistenceError>
}

export const Commitments = Context.Service<CommitmentsShape>("delta/commitments/Commitments")
