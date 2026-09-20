/**
 * What was actually still owed on a date (spec §21).
 *
 * The reason this exists rather than Delta trusting its own forecast: a
 * projection drifts from reality, and the household knows the real number. A
 * snapshot is the correction, and everything after it is recomputed from
 * there (spec §2.3, §23).
 */
import { Brand, Data } from "effect"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"

export type DebtSnapshotId = Brand.Branded<string, "DebtSnapshotId">

export const debtSnapshotId = (value: string): DebtSnapshotId => value as DebtSnapshotId

export class DebtSnapshot extends Data.Class<{
  readonly id: DebtSnapshotId
  readonly debtId: CommitmentId
  readonly date: LocalDate.LocalDate
  readonly remainingAmount: Money.Money
}> {}
