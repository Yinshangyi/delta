import { Effect, Layer, Result } from "effect"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import {
  commitmentId,
  Debt,
  OneOffExpense,
  RecurringExpense,
  RecurringTaxPayment,
  ScheduledPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import { DebtSnapshot } from "@/modules/commitments/core/domain/DebtSnapshot"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { CommitmentsLive } from "@/modules/commitments/secondary_adapters/CommitmentsLive"
import { DebtHistoryLive } from "@/modules/commitments/secondary_adapters/DebtHistoryLive"
import { name } from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { HouseholdConfigurationLive } from "@/modules/household/secondary_adapters/HouseholdConfigurationLive"
import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"

import type { HouseholdId } from "@/modules/household/core/domain/Household"

const Persistence = Layer.mergeAll(
  CommitmentsLive,
  DebtHistoryLive,
  HouseholdConfigurationLive
).pipe(Layer.provideMerge(MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))))

/** A fresh database per test — see HouseholdPersistence for why not `layer()`. */
const run = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    | typeof Commitments.Identifier
    | typeof DebtHistory.Identifier
    | typeof HouseholdConfiguration.Identifier
  >
): Promise<A> => Effect.runPromise(Effect.scoped(Effect.provide(effect, Persistence)))

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const named = (value: string) => Result.getOrThrow(name(value))
const period = (start: string, end?: string) =>
  Result.getOrThrow(ActivePeriod.make(date(start), end === undefined ? undefined : date(end)))

const household = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const created = yield* configuration.create(named("Home"), named("Ada"))
  return created.id
})

const everyKind = (owner: HouseholdId) => [
  new RecurringExpense({
    id: commitmentId("c1"),
    householdId: owner,
    name: "Rent",
    amount: euros(1_280),
    period: period("2026-09-01", "2030-08-31"),
    enabled: true
  }),
  new OneOffExpense({
    id: commitmentId("c2"),
    householdId: owner,
    name: "Kitchen",
    amount: euros(15_000),
    date: date("2026-12-04"),
    enabled: true
  }),
  new Debt({
    id: commitmentId("c3"),
    householdId: owner,
    name: "Card debt",
    initialAmount: euros(11_000),
    interestRate: Result.getOrThrow(Percentage.fromPercent(4.5)),
    regularPaymentAmount: euros(900),
    startDate: date("2026-01-01"),
    enabled: true
  }),
  new TaxLiability({
    id: commitmentId("c4"),
    householdId: owner,
    name: "2025 income tax",
    taxYear: 2025,
    status: "confirmed",
    amount: euros(21_215),
    paymentSchedule: [
      new ScheduledPayment({ date: date("2026-09-15"), amount: euros(5_303) }),
      new ScheduledPayment({ date: date("2026-12-15"), amount: euros(5_306) })
    ],
    enabled: true
  }),
  new RecurringTaxPayment({
    id: commitmentId("c5"),
    householdId: owner,
    personId: undefined,
    name: "BNC/PAS",
    amount: euros(1_600),
    period: period("2026-09-01"),
    enabled: false
  })
]

const saveEveryKind = Effect.gen(function* () {
  const owner = yield* household
  const commitments = yield* Commitments
  for (const commitment of everyKind(owner)) yield* commitments.save(commitment)
  return { owner, loaded: yield* commitments.all }
})

describe("commitments in SQLite", () => {
  it("round-trips all five kinds without loss (spec §17)", async () => {
    const { owner, loaded } = await run(saveEveryKind)

    expect(loaded).toStrictEqual(everyKind(owner))
  })

  it("keeps a tax schedule as dated rows rather than an average (spec §25)", async () => {
    const { loaded } = await run(saveEveryKind)
    const tax = loaded.find((each) => each.name === "2025 income tax")

    expect(tax).toBeInstanceOf(TaxLiability)
    expect(
      (tax as TaxLiability).paymentSchedule.map((payment) => Money.toEuros(payment.amount))
    ).toStrictEqual([5_303, 5_306])
  })

  it("replaces a schedule on save rather than appending to it", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const { owner, loaded } = yield* saveEveryKind
        const commitments = yield* Commitments
        const tax = loaded.find((each) => each.name === "2025 income tax") as TaxLiability
        yield* commitments.save(
          new TaxLiability({
            ...tax,
            householdId: owner,
            paymentSchedule: [
              new ScheduledPayment({ date: date("2027-01-15"), amount: euros(21_215) })
            ]
          })
        )
        const after = yield* commitments.all
        return (after.find((each) => each.name === "2025 income tax") as TaxLiability)
          .paymentSchedule
      })
    )

    expect(remaining.map((payment) => LocalDate.toIso(payment.date))).toStrictEqual(["2027-01-15"])
  })

  it("keeps an interest rate through the round trip, 0% included", async () => {
    const { loaded } = await run(saveEveryKind)
    const debt = loaded.find((each) => each.name === "Card debt") as Debt

    expect(Percentage.toBasisPoints(debt.interestRate)).toBe(450)
  })

  it("filters by household rather than handing back everyone's", async () => {
    const mine = await run(
      Effect.gen(function* () {
        const { owner } = yield* saveEveryKind
        const commitments = yield* Commitments
        return yield* commitments.forHousehold(owner)
      })
    )

    expect(mine).toHaveLength(5)
  })

  it("switches one off without touching the others", async () => {
    const enabled = await run(
      Effect.gen(function* () {
        yield* saveEveryKind
        const commitments = yield* Commitments
        yield* commitments.setEnabled(commitmentId("c1"), false)
        return (yield* commitments.all).map((each) => each.enabled)
      })
    )

    expect(enabled).toStrictEqual([false, true, true, true, false])
  })
})

describe("debt snapshots in SQLite", () => {
  const snapshot = (id: string, on: string, remaining: number) =>
    new DebtSnapshot({
      id: Result.getOrThrow(Result.succeed(id)) as never,
      debtId: commitmentId("c3"),
      date: date(on),
      remainingAmount: euros(remaining)
    })

  it("records a balance against its debt", async () => {
    const history = await run(
      Effect.gen(function* () {
        yield* saveEveryKind
        const debts = yield* DebtHistory
        yield* debts.record(snapshot("s1", "2026-12-31", 7_200))
        return yield* debts.forDebt(commitmentId("c3"))
      })
    )

    expect(history.map((each) => Money.toEuros(each.remainingAmount))).toStrictEqual([7_200])
  })

  it("keeps the whole history, not only the newest (spec §21)", async () => {
    const history = await run(
      Effect.gen(function* () {
        yield* saveEveryKind
        const debts = yield* DebtHistory
        yield* debts.record(snapshot("s1", "2026-12-31", 7_200))
        yield* debts.record(snapshot("s2", "2026-06-30", 9_000))
        return yield* debts.forDebt(commitmentId("c3"))
      })
    )

    expect(history.map((each) => LocalDate.toIso(each.date))).toStrictEqual([
      "2026-06-30",
      "2026-12-31"
    ])
  })

  it("loses a debt's snapshots with the debt, which CMT-10 warns about", async () => {
    const left = await run(
      Effect.gen(function* () {
        yield* saveEveryKind
        const debts = yield* DebtHistory
        const commitments = yield* Commitments
        yield* debts.record(snapshot("s1", "2026-12-31", 7_200))
        yield* commitments.remove(commitmentId("c3"))
        return yield* debts.all
      })
    )

    expect(left).toStrictEqual([])
  })
})
