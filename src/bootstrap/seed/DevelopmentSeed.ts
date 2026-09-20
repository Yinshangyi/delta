/**
 * Fill an empty database with a realistic household (DAT-03, spec §41, §50).
 *
 * Inserted through the ordinary use cases rather than raw SQL, which costs a
 * little and buys two things: the seed exercises the same validation a person
 * typing would meet, so a rule that tightened breaks the seed rather than
 * producing rows the app then refuses to read — and there is no second way
 * into the database to keep in step with the first.
 *
 * **Idempotent** (§50). It asks whether a household exists and stops if one
 * does, so running it twice, or on a database somebody has started using, adds
 * nothing.
 *
 * **Never automatic.** Production runs migrations and stops (§51); the only
 * caller of this is a development-only control.
 */
import { Effect, Option } from "effect"

import { SEED } from "@/bootstrap/seed/DevelopmentSeedData"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { addHolding } from "@/modules/capital/core/use_cases/AddHoldingUseCase"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { saveCommitment } from "@/modules/commitments/core/use_cases/SaveCommitmentUseCase"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { addFreelanceIncome } from "@/modules/household/core/use_cases/AddFreelanceIncomeUseCase"
import { addPerson } from "@/modules/household/core/use_cases/AddPersonUseCase"
import { addSalaryIncome } from "@/modules/household/core/use_cases/AddSalaryIncomeUseCase"
import { createHousehold } from "@/modules/household/core/use_cases/CreateHouseholdUseCase"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import { setFinancialGoal } from "@/modules/trajectory/core/use_cases/SetFinancialGoalUseCase"

import type { HouseholdId, PersonId } from "@/modules/household/core/domain/Household"

export type SeedServices =
  | typeof HouseholdConfiguration.Identifier
  | typeof IncomeSources.Identifier
  | typeof Commitments.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier
  | typeof Goals.Identifier

export type SeedOutcome = "seeded" | "already-populated"

const seedIncome = (sam: PersonId, alex: PersonId) =>
  Effect.gen(function* () {
    yield* addFreelanceIncome({
      personId: sam,
      name: SEED.freelance.name,
      dailyRateEuros: SEED.freelance.dailyRateEuros,
      estimatedPayoutPercent: SEED.freelance.payoutPercent,
      standardBillableDays: SEED.freelance.billableDays,
      overrides: SEED.freelance.overrides,
      startDate: SEED.freelance.startDate,
      endDate: undefined
    })

    yield* addSalaryIncome({
      personId: alex,
      name: SEED.salary.name,
      monthlyNetBeforeTaxEuros: SEED.salary.monthlyNetBeforeTaxEuros,
      monthlyIncomeTaxEuros: SEED.salary.monthlyIncomeTaxEuros,
      annualGrossEuros: undefined,
      startDate: SEED.salary.startDate,
      endDate: undefined
    })
  })

const seedCommitments = (household: HouseholdId) =>
  Effect.gen(function* () {
    for (const expense of SEED.expenses) {
      yield* saveCommitment({
        kind: "RecurringExpense",
        household,
        name: expense.name,
        amountEuros: expense.amountEuros,
        startDate: SEED.freelance.startDate,
        endDate: undefined
      })
    }

    yield* saveCommitment({ kind: "Debt", household, ...SEED.debt })

    for (const [tax, status] of [
      [SEED.confirmedTax, "confirmed"],
      [SEED.estimatedTax, "estimated"]
    ] as const) {
      yield* saveCommitment({
        kind: "TaxLiability",
        household,
        name: tax.name,
        taxYear: tax.year,
        status,
        amountEuros: tax.totalEuros,
        schedule: [...tax.schedule]
      })
    }

    yield* saveCommitment({
      kind: "RecurringTaxPayment",
      household,
      personId: undefined,
      name: SEED.recurringTax.name,
      amountEuros: SEED.recurringTax.amountEuros,
      startDate: SEED.recurringTax.startDate,
      endDate: undefined
    })
  })

const seedHoldings = (household: HouseholdId, today: string) =>
  Effect.gen(function* () {
    for (const holding of SEED.holdings) {
      yield* holding.kind === "BankAccount"
        ? addHolding({
            kind: "BankAccount",
            household,
            name: holding.name,
            institution: holding.institution,
            openingBalanceEuros: holding.valueEuros,
            balanceDate: holding.on,
            today
          })
        : addHolding({
            kind: "PhysicalAsset",
            household,
            name: holding.name,
            category: holding.category,
            resaleValueEuros: holding.valueEuros,
            valuationDate: holding.on,
            acquisitionCostEuros: holding.acquisitionCostEuros,
            acquisitionDate: holding.acquiredOn,
            today
          })
    }
  })

export const seedDevelopmentData = (
  today: string
): Effect.Effect<SeedOutcome, never, SeedServices> =>
  Effect.gen(function* () {
    const configuration = yield* HouseholdConfiguration
    if (Option.isSome(yield* configuration.current)) return "already-populated" as const

    const household = yield* createHousehold(SEED.household.name, SEED.household.first)
    const alex = yield* addPerson(household.id, SEED.household.second)

    yield* seedIncome(household.members[0]!.id, alex.id)
    yield* seedCommitments(household.id)
    yield* seedHoldings(household.id, today)
    yield* setFinancialGoal({
      household: household.id,
      name: SEED.goal.name,
      targetEuros: SEED.goal.targetEuros
    })

    return "seeded" as const
  }).pipe(Effect.orDie)
