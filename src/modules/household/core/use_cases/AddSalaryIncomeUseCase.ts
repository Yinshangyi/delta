/**
 * Salary income: a monthly net before tax and the tax withheld from it
 * (spec §12). Net after tax is their difference, computed where it is needed
 * rather than stored.
 *
 * Annual gross is informational and enters no calculation — spec §12 is
 * explicit that Delta implements no gross-to-net payroll engine.
 */
import { Effect } from "effect"

import * as IncomeSource from "@/modules/household/core/domain/IncomeSource"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import * as Money from "@/shared/domain/Money"

import type { PersonId } from "@/modules/household/core/domain/Household"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface SalaryIncomeDraft {
  readonly personId: PersonId
  readonly name: string
  readonly monthlyNetBeforeTaxEuros: number
  readonly monthlyIncomeTaxEuros: number
  readonly annualGrossEuros: number | undefined
  readonly startDate: LocalDate.LocalDate
  readonly endDate: LocalDate.LocalDate | undefined
}

export type AddSalaryIncomeError =
  | Money.InvalidMoney
  | IncomeSource.InvalidPeriod
  | PersistenceError

const optionalEuros = (
  euros: number | undefined
): Effect.Effect<Money.Money | undefined, Money.InvalidMoney> =>
  euros === undefined ? Effect.succeed(undefined) : Effect.fromResult(Money.fromEuros(euros))

export const addSalaryIncome = (
  draft: SalaryIncomeDraft
): Effect.Effect<
  IncomeSource.SalaryIncome,
  AddSalaryIncomeError,
  typeof IncomeSources.Identifier
> =>
  Effect.gen(function* () {
    const net = yield* Effect.fromResult(Money.fromEuros(draft.monthlyNetBeforeTaxEuros))
    const tax = yield* Effect.fromResult(Money.fromEuros(draft.monthlyIncomeTaxEuros))
    const annualGross = yield* optionalEuros(draft.annualGrossEuros)
    const period = yield* Effect.fromResult(
      IncomeSource.activePeriod(draft.startDate, draft.endDate)
    )

    const sources = yield* IncomeSources
    const source = new IncomeSource.SalaryIncome({
      id: yield* sources.nextId,
      personId: draft.personId,
      name: draft.name,
      monthlyNetBeforeTax: net,
      monthlyIncomeTax: tax,
      annualGross,
      period,
      enabled: true
    })
    yield* sources.save(source)
    return source
  })
