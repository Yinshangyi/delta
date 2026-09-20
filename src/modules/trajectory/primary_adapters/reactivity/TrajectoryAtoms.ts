/** The dashboard's reads and its one mutation. */
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { capitalOverviewAt } from "@/modules/capital/core/use_cases/CapitalOverviewQuery"
import { recordManyValuations } from "@/modules/capital/core/use_cases/RecordManyValuationsUseCase"
import { planVariance } from "@/modules/trajectory/core/use_cases/PlanVarianceQuery"
import { today } from "@/shared/presentation/Today"

import type { ManyValuationsDraft } from "@/modules/capital/core/use_cases/RecordManyValuationsUseCase"

export const planVarianceAtom = appRuntime.atom(planVariance)

/** The dashboard's holdings list, for the update-balances pass. */
export const dashboardHoldingsAtom = appRuntime.atom(capitalOverviewAt(today()))

export const recordManyValuationsAtom = appRuntime.fn<ManyValuationsDraft>()((draft) =>
  recordManyValuations(draft)
)
