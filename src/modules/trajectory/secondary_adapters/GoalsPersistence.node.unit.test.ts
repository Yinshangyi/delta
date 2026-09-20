import { Effect, Layer, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { name } from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { HouseholdConfigurationLive } from "@/modules/household/secondary_adapters/HouseholdConfigurationLive"
import { FinancialGoal } from "@/modules/trajectory/core/domain/FinancialGoal"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import { GoalsLive } from "@/modules/trajectory/secondary_adapters/GoalsLive"
import * as Money from "@/shared/domain/Money"

const Persistence = Layer.mergeAll(GoalsLive, HouseholdConfigurationLive).pipe(
  Layer.provideMerge(MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory)))
)

/** A fresh database per test — see HouseholdPersistence for why not `layer()`. */
const run = <A, E>(
  effect: Effect.Effect<A, E, typeof Goals.Identifier | typeof HouseholdConfiguration.Identifier>
): Promise<A> => Effect.runPromise(Effect.scoped(Effect.provide(effect, Persistence)))

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const named = (value: string) => Result.getOrThrow(name(value))

const household = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const created = yield* configuration.create(named("Home"), named("Ada"))
  return created.id
})

describe("goals in SQLite", () => {
  it("round-trips a goal without losing a cent", async () => {
    const loaded = await run(
      Effect.gen(function* () {
        const owner = yield* household
        const goals = yield* Goals
        yield* goals.save(
          new FinancialGoal({
            id: yield* goals.nextId,
            householdId: owner,
            name: "A year of runway",
            targetAmount: euros(150_000.45),
            enabled: true
          })
        )
        return yield* goals.enabled
      })
    )

    const goal = Option.getOrThrow(loaded)
    expect(goal.name).toBe("A year of runway")
    expect(Money.toCents(goal.targetAmount)).toBe(15_000_045)
  })

  it("has no goal at all before one is set", async () => {
    const loaded = await run(
      Effect.gen(function* () {
        yield* household
        const goals = yield* Goals
        return yield* goals.enabled
      })
    )

    expect(Option.isNone(loaded)).toBe(true)
  })

  it("holds several goals while projecting toward the enabled one", async () => {
    const { all, enabled } = await run(
      Effect.gen(function* () {
        const owner = yield* household
        const goals = yield* Goals
        const make = (goalName: string, target: number, on: boolean) =>
          Effect.gen(function* () {
            yield* goals.save(
              new FinancialGoal({
                id: yield* goals.nextId,
                householdId: owner,
                name: goalName,
                targetAmount: euros(target),
                enabled: on
              })
            )
          })

        yield* make("Runway", 150_000, false)
        yield* make("A house", 400_000, true)
        return { all: yield* goals.all, enabled: yield* goals.enabled }
      })
    )

    expect(all).toHaveLength(2)
    expect(Option.getOrThrow(enabled).name).toBe("A house")
  })

  it("keeps a disabled goal's figures rather than clearing them", async () => {
    const loaded = await run(
      Effect.gen(function* () {
        const owner = yield* household
        const goals = yield* Goals
        const id = yield* goals.nextId
        yield* goals.save(
          new FinancialGoal({
            id,
            householdId: owner,
            name: "Runway",
            targetAmount: euros(150_000),
            enabled: true
          })
        )
        yield* goals.setEnabled(id, false)
        return yield* goals.all
      })
    )

    expect(loaded[0]?.enabled).toBe(false)
    expect(loaded[0]?.targetAmount).toBe(euros(150_000))
  })
})
