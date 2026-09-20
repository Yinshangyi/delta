/** The module's bridge from React to Effect. One atom per use case. */
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { addHolding } from "@/modules/capital/core/use_cases/AddHoldingUseCase"
import { capitalOverviewAt } from "@/modules/capital/core/use_cases/CapitalOverviewQuery"
import { deleteHolding } from "@/modules/capital/core/use_cases/DeleteHoldingUseCase"
import { recordValuation } from "@/modules/capital/core/use_cases/RecordValuationUseCase"
import { removeValuation } from "@/modules/capital/core/use_cases/RemoveValuationUseCase"
import { setHoldingIncluded } from "@/modules/capital/core/use_cases/SetHoldingIncludedUseCase"
import { netWorthAt } from "@/modules/trajectory/core/use_cases/NetWorthQuery"
import { today } from "@/shared/presentation/Today"

import type { BalanceSnapshotId } from "@/modules/capital/core/domain/BalanceSnapshot"
import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { HoldingDraft } from "@/modules/capital/core/use_cases/HoldingDrafts"
import type { ValuationDraft } from "@/modules/capital/core/use_cases/RecordValuationUseCase"

export const capitalOverviewAtom = appRuntime.atom(capitalOverviewAt(today()))

export const netWorthAtom = appRuntime.atom(netWorthAt(today()))

export const addHoldingAtom = appRuntime.fn<HoldingDraft>()((draft) => addHolding(draft))

export const recordValuationAtom = appRuntime.fn<ValuationDraft>()((draft) =>
  recordValuation(draft)
)

export const removeValuationAtom = appRuntime.fn<BalanceSnapshotId>()((id) => removeValuation(id))

export const setHoldingIncludedAtom = appRuntime.fn<{
  readonly id: HoldingId
  readonly included: boolean
}>()(({ id, included }) => setHoldingIncluded(id, included))

export const deleteHoldingAtom = appRuntime.fn<HoldingId>()((id) => deleteHolding(id))
