import { Effect } from "effect"

/** The module's bridge from React to Effect. One atom per use case. */
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { commitmentsOverview } from "@/modules/commitments/core/use_cases/CommitmentsOverviewQuery"
import { deleteCommitment } from "@/modules/commitments/core/use_cases/DeleteCommitmentUseCase"
import { recordDebtBalance } from "@/modules/commitments/core/use_cases/RecordDebtBalanceUseCase"
import { removeDebtBalance } from "@/modules/commitments/core/use_cases/RemoveDebtBalanceUseCase"
import { saveCommitment } from "@/modules/commitments/core/use_cases/SaveCommitmentUseCase"
import { setCommitmentEnabled } from "@/modules/commitments/core/use_cases/SetCommitmentEnabledUseCase"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { DebtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import type { CommitmentDraft } from "@/modules/commitments/core/use_cases/CommitmentDrafts"
import type { DebtBalanceDraft } from "@/modules/commitments/core/use_cases/RecordDebtBalanceUseCase"

export const commitmentsOverviewAtom = appRuntime.atom(commitmentsOverview)

export const debtHistoryAtom = appRuntime.atom(
  Effect.gen(function* () {
    const history = yield* DebtHistory
    return yield* history.all
  })
)

export const saveCommitmentAtom = appRuntime.fn<{
  readonly draft: CommitmentDraft
  readonly existing: CommitmentId | undefined
}>()(({ draft, existing }) => saveCommitment(draft, existing))

export const setCommitmentEnabledAtom = appRuntime.fn<{
  readonly id: CommitmentId
  readonly enabled: boolean
}>()(({ id, enabled }) => setCommitmentEnabled(id, enabled))

export const deleteCommitmentAtom = appRuntime.fn<CommitmentId>()((id) => deleteCommitment(id))

export const recordDebtBalanceAtom = appRuntime.fn<DebtBalanceDraft>()((draft) =>
  recordDebtBalance(draft)
)

export const removeDebtBalanceAtom = appRuntime.fn<DebtSnapshotId>()((id) => removeDebtBalance(id))
