import { Effect, Layer, Option } from "effect"
import { SqlClient } from "effect/unstable/sql"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { seedDevelopmentData } from "@/bootstrap/seed/DevelopmentSeed"
import { SEED } from "@/bootstrap/seed/DevelopmentSeedData"
import { resetToSeed } from "@/bootstrap/seed/ResetDevelopmentDatabase"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { capitalAdaptersLayer } from "@/modules/capital/Dependencies"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { commitmentsAdaptersLayer } from "@/modules/commitments/Dependencies"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { createHousehold } from "@/modules/household/core/use_cases/CreateHouseholdUseCase"
import { householdAdaptersLayer } from "@/modules/household/Dependencies"
import { scenariosAdaptersLayer } from "@/modules/scenarios/Dependencies"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import { trajectoryAdaptersLayer } from "@/modules/trajectory/Dependencies"

const persisted = MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))
const AppUnderTest = Layer.mergeAll(
  householdAdaptersLayer,
  trajectoryAdaptersLayer,
  commitmentsAdaptersLayer,
  capitalAdaptersLayer,
  scenariosAdaptersLayer
).pipe(Layer.provideMerge(persisted))

type Services =
  | SqlClient.SqlClient
  | typeof HouseholdConfiguration.Identifier
  | typeof IncomeSources.Identifier
  | typeof Goals.Identifier
  | typeof Commitments.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier

const run = <A, E>(effect: Effect.Effect<A, E, Services>): Promise<A> =>
  Effect.runPromise(Effect.scoped(Effect.provide(effect, AppUnderTest)))

/**
 * Deliberately not a date the seed data mentions. The seed once carried fixed
 * valuation dates, which are in the future for anyone running it earlier —
 * and a future valuation is refused, so the seed died after the commitments
 * and before the goal. A `today` that happened to match hid it.
 */
const TODAY = "2026-01-15"

const counts = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const sources = yield* IncomeSources
  const commitments = yield* Commitments
  const holdings = yield* Holdings
  const goals = yield* Goals
  const household = yield* configuration.current

  return {
    people: Option.match(household, { onNone: () => 0, onSome: (each) => each.members.length }),
    income: (yield* sources.all).length,
    commitments: (yield* commitments.all).length,
    holdings: (yield* holdings.all).length,
    goals: (yield* goals.all).length
  }
})

describe("the development seed", () => {
  it("covers everything a screen needs to render (DAT-03)", async () => {
    const after = await run(seedDevelopmentData(TODAY).pipe(Effect.flatMap(() => counts)))

    expect(after).toStrictEqual({
      people: 2,
      income: 2,
      commitments: SEED.expenses.length + 1 + 2 + 1,
      holdings: SEED.holdings.length,
      goals: 1
    })
  })

  it("adds nothing the second time it runs (spec §50)", async () => {
    const { first, second, outcome } = await run(
      Effect.gen(function* () {
        yield* seedDevelopmentData(TODAY)
        const first = yield* counts
        const outcome = yield* seedDevelopmentData(TODAY)
        return { first, second: yield* counts, outcome }
      })
    )

    expect(second).toStrictEqual(first)
    expect(outcome).toBe("already-populated")
  })

  it("leaves a household somebody has started using alone", async () => {
    const { outcome, after } = await run(
      Effect.gen(function* () {
        // Somebody set Delta up themselves, then a developer hits Seed.
        yield* Effect.orDie(createHousehold("Mine", "Me"))
        const outcome = yield* seedDevelopmentData(TODAY)
        return { outcome, after: yield* counts }
      })
    )

    expect(outcome).toBe("already-populated")
    expect(after.people).toBe(1)
    expect(after.income).toBe(0)
  })

  it("passes the same validation a person typing would meet", async () => {
    const income = await run(
      seedDevelopmentData(TODAY).pipe(
        Effect.flatMap(() =>
          Effect.gen(function* () {
            const sources = yield* IncomeSources
            return (yield* sources.all).map((each) => each.name)
          })
        )
      )
    )

    // Built through the use cases, so a rule that tightened breaks the seed
    // rather than producing rows the app then refuses to read.
    expect(income.sort()).toStrictEqual([SEED.freelance.name, SEED.salary.name].sort())
  })
})

describe("resetting", () => {
  it("empties every table and seeds again (DAT-04)", async () => {
    const after = await run(
      Effect.gen(function* () {
        yield* seedDevelopmentData(TODAY)
        const commitments = yield* Commitments
        yield* commitments.remove((yield* commitments.all)[0]!.id)

        yield* resetToSeed(TODAY)
        return yield* counts
      })
    )

    expect(after.commitments).toBe(SEED.expenses.length + 1 + 2 + 1)
  })

  it("is safe on an empty database", async () => {
    const after = await run(resetToSeed(TODAY).pipe(Effect.flatMap(() => counts)))

    expect(after.people).toBe(2)
  })
})
