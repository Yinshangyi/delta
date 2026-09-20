/**
 * Scenario overrides applied to income sources (SCN-03).
 *
 * Rebuilt through the variants' own constructors rather than mutated: what is
 * passed in is the household's real configuration, and a simulation that
 * altered it would be an edit nobody asked for.
 *
 * An override naming a freelance field leaves a salary alone and the reverse,
 * so "rate to €700" applied to a household with one of each changes exactly
 * one of them.
 */
import { Match } from "effect"

import {
  BillableDaysPlan,
  FreelanceIncome,
  SalaryIncome,
  type IncomeSource
} from "@/modules/household/core/domain/IncomeSource"

import type { ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"

const onFreelance = (
  source: IncomeSource,
  matches: boolean,
  change: (freelance: FreelanceIncome) => IncomeSource
): IncomeSource =>
  !matches
    ? source
    : Match.valueTags(source, {
        FreelanceIncome: change,
        SalaryIncome: (salary): IncomeSource => salary
      })

const onSalary = (
  source: IncomeSource,
  matches: boolean,
  change: (salary: SalaryIncome) => IncomeSource
): IncomeSource =>
  !matches
    ? source
    : Match.valueTags(source, {
        FreelanceIncome: (freelance): IncomeSource => freelance,
        SalaryIncome: change
      })

const changedIncome = (source: IncomeSource, override: ScenarioOverride): IncomeSource =>
  Match.valueTags(override, {
    ChangeDailyRate: (change) =>
      onFreelance(
        source,
        change.incomeSourceId === source.id,
        (freelance) => new FreelanceIncome({ ...freelance, dailyRate: change.dailyRate })
      ),
    ChangeBillableDays: (change) =>
      onFreelance(
        source,
        change.incomeSourceId === source.id,
        (freelance) =>
          new FreelanceIncome({
            ...freelance,
            billableDays: new BillableDaysPlan({
              ...freelance.billableDays,
              standard: change.standard
            })
          })
      ),
    ChangePayoutRatio: (change) =>
      onFreelance(
        source,
        change.incomeSourceId === source.id,
        (freelance) => new FreelanceIncome({ ...freelance, estimatedPayoutRatio: change.ratio })
      ),
    ChangeIncome: (change) =>
      onSalary(
        source,
        change.incomeSourceId === source.id,
        (salary) => new SalaryIncome({ ...salary, monthlyNetBeforeTax: change.monthlyNetBeforeTax })
      ),
    AddHypotheticalExpense: (): IncomeSource => source,
    DisableCommitment: (): IncomeSource => source,
    ExcludeHolding: (): IncomeSource => source,
    ChangeHoldingValue: (): IncomeSource => source
  })

export const overriddenIncome = (
  sources: ReadonlyArray<IncomeSource>,
  overrides: ReadonlyArray<ScenarioOverride>
): ReadonlyArray<IncomeSource> => sources.map((source) => overrides.reduce(changedIncome, source))
