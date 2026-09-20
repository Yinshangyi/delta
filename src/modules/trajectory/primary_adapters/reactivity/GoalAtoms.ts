/** The module's bridge from React to Effect. One atom per use case. */
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { activeGoal } from "@/modules/trajectory/core/use_cases/ActiveGoalQuery"
import { setFinancialGoal } from "@/modules/trajectory/core/use_cases/SetFinancialGoalUseCase"
import { setGoalEnabled } from "@/modules/trajectory/core/use_cases/SetGoalEnabledUseCase"

import type { FinancialGoalId } from "@/modules/trajectory/core/domain/FinancialGoal"
import type { FinancialGoalDraft } from "@/modules/trajectory/core/use_cases/SetFinancialGoalUseCase"

export const activeGoalAtom = appRuntime.atom(activeGoal)

export const setFinancialGoalAtom = appRuntime.fn<FinancialGoalDraft>()((draft) =>
  setFinancialGoal(draft)
)

export const setGoalEnabledAtom = appRuntime.fn<{
  readonly id: FinancialGoalId
  readonly enabled: boolean
}>()(({ id, enabled }) => setGoalEnabled(id, enabled))
