/**
 * Switching a source off models a contract ending without losing its record
 * (spec §14). `cashFlowsFor` already yields nothing for a disabled source, so
 * the projection follows from the flag alone.
 */
import { Effect } from "effect"

import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"

import type { IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const setIncomeSourceEnabled = (
  id: IncomeSourceId,
  enabled: boolean
): Effect.Effect<void, PersistenceError, typeof IncomeSources.Identifier> =>
  Effect.gen(function* () {
    const sources = yield* IncomeSources
    yield* sources.setEnabled(id, enabled)
  })
