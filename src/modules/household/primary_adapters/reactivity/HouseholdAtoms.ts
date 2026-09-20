/**
 * The module's only bridge from React to Effect (architecture.md).
 *
 * Each atom is one use case and nothing else — no branching, no assembling of
 * two reads. `householdOverviewAtom` is the single read every household screen
 * renders from, so a mutation has exactly one thing to refresh.
 */
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { addFreelanceIncome } from "@/modules/household/core/use_cases/AddFreelanceIncomeUseCase"
import { addPerson } from "@/modules/household/core/use_cases/AddPersonUseCase"
import { addSalaryIncome } from "@/modules/household/core/use_cases/AddSalaryIncomeUseCase"
import { createHousehold } from "@/modules/household/core/use_cases/CreateHouseholdUseCase"
import { householdOverview } from "@/modules/household/core/use_cases/HouseholdOverviewQuery"
import { removePerson } from "@/modules/household/core/use_cases/RemovePersonUseCase"
import { renameHousehold } from "@/modules/household/core/use_cases/RenameHouseholdUseCase"
import { renamePerson } from "@/modules/household/core/use_cases/RenamePersonUseCase"
import { setBillableDaysOverride } from "@/modules/household/core/use_cases/SetBillableDaysOverrideUseCase"
import { setIncomeSourceEnabled } from "@/modules/household/core/use_cases/SetIncomeSourceEnabledUseCase"

import type { HouseholdId, PersonId } from "@/modules/household/core/domain/Household"
import type { FreelanceIncome, IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type { FreelanceIncomeDraft } from "@/modules/household/core/use_cases/AddFreelanceIncomeUseCase"
import type { SalaryIncomeDraft } from "@/modules/household/core/use_cases/AddSalaryIncomeUseCase"
import type * as YearMonth from "@/shared/domain/YearMonth"

export const householdOverviewAtom = appRuntime.atom(householdOverview)

export const createHouseholdAtom = appRuntime.fn<{
  readonly household: string
  readonly firstPerson: string
}>()(({ household, firstPerson }) => createHousehold(household, firstPerson))

export const renameHouseholdAtom = appRuntime.fn<{
  readonly id: HouseholdId
  readonly to: string
}>()(({ id, to }) => renameHousehold(id, to))

export const addPersonAtom = appRuntime.fn<{
  readonly household: HouseholdId
  readonly person: string
}>()(({ household, person }) => addPerson(household, person))

export const renamePersonAtom = appRuntime.fn<{
  readonly person: PersonId
  readonly to: string
}>()(({ person, to }) => renamePerson(person, to))

export const removePersonAtom = appRuntime.fn<PersonId>()((person) => removePerson(person))

export const addFreelanceIncomeAtom = appRuntime.fn<FreelanceIncomeDraft>()((draft) =>
  addFreelanceIncome(draft)
)

export const addSalaryIncomeAtom = appRuntime.fn<SalaryIncomeDraft>()((draft) =>
  addSalaryIncome(draft)
)

export const setIncomeSourceEnabledAtom = appRuntime.fn<{
  readonly id: IncomeSourceId
  readonly enabled: boolean
}>()(({ id, enabled }) => setIncomeSourceEnabled(id, enabled))

export const setBillableDaysOverrideAtom = appRuntime.fn<{
  readonly source: FreelanceIncome
  readonly month: YearMonth.YearMonth
  readonly days: number | undefined
}>()(({ source, month, days }) => setBillableDaysOverride(source, month, days))
