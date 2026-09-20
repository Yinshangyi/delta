import { Effect, Layer, Result } from "effect"
import { SqlClient } from "effect/unstable/sql"
import { describe, expect, it } from "vitest"

import { BACKUP_TABLES, NOT_BACKED_UP } from "@/bootstrap/backup/BackupTables"
import { exportBackup, toFileContents } from "@/bootstrap/backup/ExportBackup"
import { importBackup, parseBackup, summarise } from "@/bootstrap/backup/ImportBackup"
import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { addHolding } from "@/modules/capital/core/use_cases/AddHoldingUseCase"
import { capitalAdaptersLayer } from "@/modules/capital/Dependencies"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { saveCommitment } from "@/modules/commitments/core/use_cases/SaveCommitmentUseCase"
import { commitmentsAdaptersLayer } from "@/modules/commitments/Dependencies"
import { name } from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { addSalaryIncome } from "@/modules/household/core/use_cases/AddSalaryIncomeUseCase"
import { householdAdaptersLayer } from "@/modules/household/Dependencies"
import { Scenarios } from "@/modules/scenarios/core/ports/secondary/Scenarios"
import { scenariosAdaptersLayer } from "@/modules/scenarios/Dependencies"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import { setFinancialGoal } from "@/modules/trajectory/core/use_cases/SetFinancialGoalUseCase"
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
  | typeof DebtHistory.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier
  | typeof Scenarios.Identifier

const run = <A, E>(effect: Effect.Effect<A, E, Services>): Promise<A> =>
  Effect.runPromise(Effect.scoped(Effect.provide(effect, AppUnderTest)))

const named = (value: string) => Result.getOrThrow(name(value))

/** Something in every table a backup carries. */
const household = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const created = yield* configuration.create(named("Home"), named("Ada"))

  yield* addSalaryIncome({
    personId: created.members[0]!.id,
    name: "Employment",
    monthlyNetBeforeTaxEuros: 3_000,
    monthlyIncomeTaxEuros: 300,
    annualGrossEuros: undefined,
    startDate: "2026-01-01",
    endDate: undefined
  })

  yield* saveCommitment({
    kind: "RecurringExpense",
    household: created.id,
    name: "Rent",
    amountEuros: 1_280,
    startDate: "2026-01-01",
    endDate: undefined
  })

  yield* addHolding({
    kind: "BankAccount",
    household: created.id,
    name: "Joint current account",
    institution: "A bank",
    openingBalanceEuros: 24_000,
    balanceDate: "2026-09-30",
    today: "2026-09-30"
  })

  yield* setFinancialGoal({ household: created.id, name: "Runway", targetEuros: 150_000 })
  return created.id
}).pipe(Effect.orDie)

describe("what a backup carries", () => {
  it("names every table the database actually has (DAT-01)", async () => {
    const tables = await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        return yield* sql<{ readonly name: string }>`
          SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        `
      })
    )

    // A table added in a later migration and forgotten in BACKUP_TABLES would
    // export cleanly, import cleanly, and lose the household's data silently.
    const known = [...BACKUP_TABLES, ...NOT_BACKED_UP].sort()
    expect(tables.map((each) => each.name).sort()).toStrictEqual(known)
  })
})

describe("exporting", () => {
  it("writes every row the household owns", async () => {
    const document = await run(
      household.pipe(Effect.flatMap(() => exportBackup("2026-09-30T12:00:00.000Z")))
    )

    expect(document.tables.households).toHaveLength(1)
    expect(document.tables.people).toHaveLength(1)
    expect(document.tables.income_sources).toHaveLength(1)
    expect(document.tables.commitments).toHaveLength(1)
    expect(document.tables.holdings).toHaveLength(1)
    expect(document.tables.balance_snapshots).toHaveLength(1)
    expect(document.tables.financial_goals).toHaveLength(1)
  })

  it("produces a file a person can read (DAT-01)", async () => {
    const contents = await run(
      household.pipe(
        Effect.flatMap(() => exportBackup("2026-09-30T12:00:00.000Z")),
        Effect.map(toFileContents)
      )
    )

    expect(contents).toContain('"application": "delta"')
    expect(contents).toContain("Joint current account")
    expect(contents.split("\n").length).toBeGreaterThan(20)
  })
})

describe("importing", () => {
  const exported = household.pipe(
    Effect.flatMap(() => exportBackup("2026-09-30T12:00:00.000Z")),
    Effect.map(toFileContents)
  )

  it("round-trips a backup exactly", async () => {
    const { before, after } = await run(
      Effect.gen(function* () {
        const contents = yield* exported
        const before = yield* exportBackup("x")

        const parsed = Result.getOrThrow(parseBackup(contents))
        yield* importBackup(parsed)

        return { before, after: yield* exportBackup("x") }
      })
    )

    expect(after.tables).toStrictEqual(before.tables)
  })

  it("replaces what was there rather than adding to it", async () => {
    const counts = await run(
      Effect.gen(function* () {
        const contents = yield* exported
        const parsed = Result.getOrThrow(parseBackup(contents))

        yield* importBackup(parsed)
        yield* importBackup(parsed)

        const after = yield* exportBackup("x")
        return after.tables.households.length
      })
    )

    expect(counts).toBe(1)
  })

  it("summarises what will change before anything is written (DAT-02)", async () => {
    const summary = await run(
      Effect.gen(function* () {
        const contents = yield* exported
        const parsed = Result.getOrThrow(parseBackup(contents))
        return yield* summarise(parsed)
      })
    )

    expect(summary.existing.households).toBe(1)
    expect(summary.incoming.households).toBe(1)
    expect(summary.exportedAt).toBe("2026-09-30T12:00:00.000Z")
  })

  it("refuses a file that is not JSON at all", () => {
    const outcome = parseBackup("this is not a backup")

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("refuses JSON that is not Delta's (DAT-02)", () => {
    const outcome = parseBackup('{"application":"something else","version":1}')

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("reports a newer format clearly rather than half-applying it", () => {
    const outcome = parseBackup('{"application":"delta","version":99,"exportedAt":"x","tables":{}}')

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("leaves existing data untouched when the file is malformed (DAT-02)", async () => {
    const households = await run(
      Effect.gen(function* () {
        yield* household
        const outcome = parseBackup('{"application":"delta","version":1,"tables":"nonsense"}')
        expect(Result.isFailure(outcome)).toBe(true)

        return (yield* exportBackup("x")).tables.households.length
      })
    )

    expect(households).toBe(1)
  })

  it("leaves existing data untouched when a row cannot be inserted", async () => {
    const households = await run(
      Effect.gen(function* () {
        const contents = yield* exported
        const parsed = Result.getOrThrow(parseBackup(contents))

        // A person belonging to a household the file does not carry: the
        // foreign key refuses it, and the whole restore has to roll back.
        const broken = {
          ...parsed,
          tables: {
            ...parsed.tables,
            people: [
              ...parsed.tables.people,
              { id: "orphan", household_id: "nobody", name: "Nobody" }
            ]
          }
        }

        const outcome = yield* Effect.result(importBackup(broken))
        expect(Result.isFailure(outcome)).toBe(true)

        return (yield* exportBackup("x")).tables.households.length
      })
    )

    expect(households).toBe(1)
  })
})
