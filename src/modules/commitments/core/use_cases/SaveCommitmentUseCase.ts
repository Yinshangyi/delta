/**
 * Add or change a commitment (spec §18 to §27).
 *
 * One use case for all five kinds and for both add and edit, because from the
 * person's side there is one action — "this is what we pay" — and the shape of
 * it is already decided by the draft they filled in. `existing` carries the id
 * when it is an edit, so nothing has to ask whether it is creating.
 */
import { Effect } from "effect"

import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { commitmentFrom } from "@/modules/commitments/core/use_cases/CommitmentFromDraft"

import type { Commitment, CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { CommitmentDraft } from "@/modules/commitments/core/use_cases/CommitmentDrafts"
import type { InvalidCommitment } from "@/modules/commitments/core/use_cases/CommitmentFromDraft"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const saveCommitment = (
  draft: CommitmentDraft,
  existing?: CommitmentId
): Effect.Effect<Commitment, InvalidCommitment | PersistenceError, typeof Commitments.Identifier> =>
  Effect.gen(function* () {
    const commitments = yield* Commitments
    const id = existing ?? (yield* commitments.nextId)
    const commitment = yield* commitmentFrom(id, draft)
    yield* commitments.save(commitment)
    return commitment
  })
