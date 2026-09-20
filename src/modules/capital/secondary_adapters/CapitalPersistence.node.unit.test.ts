import { Effect, Layer, Result } from "effect"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { BalanceSnapshot, balanceSnapshotId } from "@/modules/capital/core/domain/BalanceSnapshot"
import { BankAccount, holdingId, PhysicalAsset } from "@/modules/capital/core/domain/Holding"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { HoldingsLive } from "@/modules/capital/secondary_adapters/HoldingsLive"
import { ValuationHistoryLive } from "@/modules/capital/secondary_adapters/ValuationHistoryLive"
import { name } from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { HouseholdConfigurationLive } from "@/modules/household/secondary_adapters/HouseholdConfigurationLive"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { HouseholdId } from "@/modules/household/core/domain/Household"

const Persistence = Layer.mergeAll(
  HoldingsLive,
  ValuationHistoryLive,
  HouseholdConfigurationLive
).pipe(Layer.provideMerge(MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))))

/** A fresh database per test — see HouseholdPersistence for why not `layer()`. */
const run = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    | typeof Holdings.Identifier
    | typeof ValuationHistory.Identifier
    | typeof HouseholdConfiguration.Identifier
  >
): Promise<A> => Effect.runPromise(Effect.scoped(Effect.provide(effect, Persistence)))

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const named = (value: string) => Result.getOrThrow(name(value))

const household = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const created = yield* configuration.create(named("Home"), named("Ada"))
  return created.id
})

const bothKinds = (owner: HouseholdId) => [
  new BankAccount({
    id: holdingId("a1"),
    householdId: owner,
    name: "Joint current account",
    institution: "A bank",
    includedInCapital: true,
    enabled: true
  }),
  new PhysicalAsset({
    id: holdingId("p1"),
    householdId: owner,
    name: "Dive watch",
    category: "watch",
    acquisitionCost: euros(9_000),
    acquisitionDate: date("2024-03-01"),
    includedInCapital: false,
    enabled: true
  })
]

const saveBoth = Effect.gen(function* () {
  const owner = yield* household
  const holdings = yield* Holdings
  for (const holding of bothKinds(owner)) yield* holdings.save(holding)
  return { owner, loaded: yield* holdings.all }
})

describe("holdings in SQLite", () => {
  it("round-trips both kinds without loss (CAP-01)", async () => {
    const { owner, loaded } = await run(saveBoth)

    expect(loaded).toStrictEqual(bothKinds(owner))
  })

  it("keeps an account with no institution, which is optional", async () => {
    const loaded = await run(
      Effect.gen(function* () {
        const owner = yield* household
        const holdings = yield* Holdings
        yield* holdings.save(
          new BankAccount({
            id: holdingId("a2"),
            householdId: owner,
            name: "Emergency fund",
            institution: undefined,
            includedInCapital: true,
            enabled: true
          })
        )
        return yield* holdings.all
      })
    )

    expect((loaded[0] as BankAccount).institution).toBeUndefined()
  })

  it("keeps acquisition cost through the round trip, where it stays informational", async () => {
    const { loaded } = await run(saveBoth)
    const asset = loaded.find((each) => each.name === "Dive watch") as PhysicalAsset

    expect(asset.acquisitionCost).toBe(euros(9_000))
    expect(asset.acquisitionDate).toBe(date("2024-03-01"))
  })

  it("persists the inclusion flag, which is configuration rather than a filter", async () => {
    const included = await run(
      Effect.gen(function* () {
        yield* saveBoth
        const holdings = yield* Holdings
        yield* holdings.setIncluded(holdingId("a1"), false)
        return (yield* holdings.all).map((each) => each.includedInCapital)
      })
    )

    expect(included).toStrictEqual([false, false])
  })

  it("filters by household rather than handing back everyone's", async () => {
    const mine = await run(
      Effect.gen(function* () {
        const { owner } = yield* saveBoth
        const holdings = yield* Holdings
        return yield* holdings.forHousehold(owner)
      })
    )

    expect(mine).toHaveLength(2)
  })
})

describe("valuations in SQLite", () => {
  const snapshot = (
    id: string,
    holding: string,
    on: string,
    amount: number,
    basis: "actual" | "estimated"
  ) =>
    new BalanceSnapshot({
      id: balanceSnapshotId(id),
      holdingId: holdingId(holding),
      date: date(on),
      amount: euros(amount),
      basis
    })

  it("round-trips a dated valuation with its basis (CAP-02)", async () => {
    const history = await run(
      Effect.gen(function* () {
        yield* saveBoth
        const valuations = yield* ValuationHistory
        yield* valuations.record(snapshot("s1", "a1", "2026-09-30", 24_000, "actual"))
        yield* valuations.record(snapshot("s2", "p1", "2026-09-30", 11_000, "estimated"))
        return yield* valuations.all
      })
    )

    expect(history.map((each) => each.basis)).toStrictEqual(["actual", "estimated"])
    expect(history.map((each) => Money.toEuros(each.amount))).toStrictEqual([24_000, 11_000])
  })

  it("keeps the whole history for a holding, not only the newest", async () => {
    const history = await run(
      Effect.gen(function* () {
        yield* saveBoth
        const valuations = yield* ValuationHistory
        yield* valuations.record(snapshot("s1", "a1", "2026-09-30", 24_000, "actual"))
        yield* valuations.record(snapshot("s2", "a1", "2026-06-30", 20_000, "actual"))
        return yield* valuations.forHolding(holdingId("a1"))
      })
    )

    expect(history.map((each) => LocalDate.toIso(each.date))).toStrictEqual([
      "2026-06-30",
      "2026-09-30"
    ])
  })

  it("stores a negative balance, because overdrafts are real (CAP-03)", async () => {
    const history = await run(
      Effect.gen(function* () {
        yield* saveBoth
        const valuations = yield* ValuationHistory
        yield* valuations.record(snapshot("s1", "a1", "2026-09-30", -450, "actual"))
        return yield* valuations.all
      })
    )

    expect(history.map((each) => Money.toEuros(each.amount))).toStrictEqual([-450])
  })

  it("loses a holding's valuations with the holding, which CAP-09 warns about", async () => {
    const left = await run(
      Effect.gen(function* () {
        yield* saveBoth
        const valuations = yield* ValuationHistory
        const holdings = yield* Holdings
        yield* valuations.record(snapshot("s1", "a1", "2026-09-30", 24_000, "actual"))
        yield* holdings.remove(holdingId("a1"))
        return yield* valuations.all
      })
    )

    expect(left).toStrictEqual([])
  })
})
