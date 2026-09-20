/** What this module needs wiring (spec §53, FND-10). */
import { Layer } from "effect"

import { CommitmentsLive } from "@/modules/commitments/secondary_adapters/CommitmentsLive"
import { DebtHistoryLive } from "@/modules/commitments/secondary_adapters/DebtHistoryLive"

import type { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import type { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import type { SqlClient } from "effect/unstable/sql"

export const commitmentsAdaptersLayer: Layer.Layer<
  typeof Commitments.Identifier | typeof DebtHistory.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.mergeAll(CommitmentsLive, DebtHistoryLive)
