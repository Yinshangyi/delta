/**
 * Permanent, unlike disabling (spec §28, CMT-10).
 *
 * A debt's recorded balances go with it — the schema cascades, which is why
 * the confirmation has to say so before the fact rather than the list quietly
 * shrinking afterwards.
 */
import { Effect } from "effect"

import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const deleteCommitment = (
  id: CommitmentId
): Effect.Effect<void, PersistenceError, typeof Commitments.Identifier> =>
  Effect.gen(function* () {
    const commitments = yield* Commitments
    yield* commitments.remove(id)
  })
