/**
 * Switching a commitment off models dropping an expense without losing the
 * record (spec §18, §40). `cashFlowsFor` already yields nothing for a disabled
 * commitment, so the projection follows from the flag alone.
 */
import { Effect } from "effect"

import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const setCommitmentEnabled = (
  id: CommitmentId,
  enabled: boolean
): Effect.Effect<void, PersistenceError, typeof Commitments.Identifier> =>
  Effect.gen(function* () {
    const commitments = yield* Commitments
    yield* commitments.setEnabled(id, enabled)
  })
