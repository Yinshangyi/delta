import { Effect, Layer, Result } from "effect"
import { describe, expect, it } from "vitest"

import { BalanceSnapshot, balanceSnapshotId } from "@/modules/capital/core/domain/BalanceSnapshot"
import { BankAccount, holdingId, PhysicalAsset } from "@/modules/capital/core/domain/Holding"
import { addHolding } from "@/modules/capital/core/use_cases/AddHoldingUseCase"
import { capitalOverviewAt } from "@/modules/capital/core/use_cases/CapitalOverviewQuery"
import { totalCapitalAt } from "@/modules/capital/core/use_cases/CapitalSourcesQuery"
import { deleteHolding } from "@/modules/capital/core/use_cases/DeleteHoldingUseCase"
import { recordManyValuations } from "@/modules/capital/core/use_cases/RecordManyValuationsUseCase"
import { recordValuation } from "@/modules/capital/core/use_cases/RecordValuationUseCase"
import { setHoldingIncluded } from "@/modules/capital/core/use_cases/SetHoldingIncludedUseCase"
import { makeHoldingsStub } from "@/modules/capital/secondary_adapters/HoldingsStub"
import { makeValuationHistoryStub } from "@/modules/capital/secondary_adapters/ValuationHistoryStub"
import { householdId } from "@/modules/household/core/domain/Household"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { Holding } from "@/modules/capital/core/domain/Holding"
import type { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import type { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const home = householdId("h1")
const TODAY = "2026-09-30"

const withStubs = <A, E>(
  holdings: ReadonlyArray<Holding>,
  snapshots: ReadonlyArray<BalanceSnapshot>,
  use: (stubs: {
    readonly holdings: ReturnType<typeof makeHoldingsStub>
    readonly valuations: ReturnType<typeof makeValuationHistoryStub>
  }) => Effect.Effect<A, E, typeof Holdings.Identifier | typeof ValuationHistory.Identifier>
): Promise<A> => {
  const stubs = {
    holdings: makeHoldingsStub({ holdings }),
    valuations: makeValuationHistoryStub({ snapshots })
  }
  return Effect.runPromise(
    Effect.provide(use(stubs), Layer.mergeAll(stubs.holdings.layer, stubs.valuations.layer))
  )
}

const account = (overrides: Partial<ConstructorParameters<typeof BankAccount>[0]> = {}) =>
  new BankAccount({
    id: holdingId("a1"),
    householdId: home,
    name: "Joint current account",
    institution: undefined,
    includedInCapital: true,
    enabled: true,
    ...overrides
  })

const asset = (overrides: Partial<ConstructorParameters<typeof PhysicalAsset>[0]> = {}) =>
  new PhysicalAsset({
    id: holdingId("p1"),
    householdId: home,
    name: "Dive watch",
    category: "watch",
    acquisitionCost: euros(9_000),
    acquisitionDate: date("2024-03-01"),
    includedInCapital: true,
    enabled: true,
    ...overrides
  })

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

describe("adding a bank account", () => {
  const draft = () => ({
    kind: "BankAccount" as const,
    household: home,
    name: "Joint current account",
    institution: "A bank",
    openingBalanceEuros: 24_000,
    balanceDate: TODAY,
    today: TODAY
  })

  it("records the opening balance as an actual valuation (CAP-03)", async () => {
    const snapshots = await withStubs([], [], (stubs) =>
      addHolding(draft()).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    expect(snapshots.map((each) => each.basis)).toStrictEqual(["actual"])
    expect(snapshots.map((each) => Money.toEuros(each.amount))).toStrictEqual([24_000])
  })

  it("refuses an opening balance dated in the future, as recording one does", async () => {
    const outcome = await withStubs([], [], (stubs) =>
      Effect.result(addHolding({ ...draft(), balanceDate: "2027-01-31" })).pipe(
        Effect.map((result) => ({ result, stored: stubs.holdings.inspect().holdings }))
      )
    )

    // Accepted quietly, it produced a holding that read as having no value at
    // all while its figure sat in the database.
    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.stored).toStrictEqual([])
  })

  it("counts toward capital immediately, with no further step", async () => {
    const total = await withStubs([], [], () =>
      addHolding(draft()).pipe(Effect.flatMap(() => totalCapitalAt(date(TODAY))))
    )

    expect(total).toBe(euros(24_000))
  })

  it("is included in capital by default (CAP-03)", async () => {
    const saved = await withStubs([], [], () => addHolding(draft()))

    expect(saved.includedInCapital).toBe(true)
  })

  it("accepts an overdraft, because overdrafts are real", async () => {
    const total = await withStubs([], [], () =>
      addHolding({ ...draft(), openingBalanceEuros: -450 }).pipe(
        Effect.flatMap(() => totalCapitalAt(date(TODAY)))
      )
    )

    expect(total).toBe(euros(-450))
  })

  it("behaves as the old single-savings model with one account (spec §71)", async () => {
    const total = await withStubs([], [], () =>
      addHolding(draft()).pipe(Effect.flatMap(() => totalCapitalAt(date(TODAY))))
    )

    expect(total).toBe(euros(24_000))
  })
})

describe("adding a physical asset", () => {
  const draft = () => ({
    kind: "PhysicalAsset" as const,
    household: home,
    name: "Dive watch",
    category: "watch",
    resaleValueEuros: 11_000,
    valuationDate: TODAY,
    acquisitionCostEuros: 9_000,
    acquisitionDate: "2024-03-01",
    today: TODAY
  })

  it("records the resale value as an estimate (spec §70)", async () => {
    const snapshots = await withStubs([], [], (stubs) =>
      addHolding(draft()).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    expect(snapshots.map((each) => each.basis)).toStrictEqual(["estimated"])
  })

  it("keeps acquisition cost out of capital entirely (spec §78)", async () => {
    const total = await withStubs([], [], () =>
      addHolding(draft()).pipe(Effect.flatMap(() => totalCapitalAt(date(TODAY))))
    )

    // Bought for €9,000, carried at €11,000. Capital is the valuation, and
    // no gain of €2,000 exists anywhere.
    expect(total).toBe(euros(11_000))
  })

  it("accepts an asset with no acquisition cost at all", async () => {
    const saved = await withStubs([], [], () =>
      addHolding({ ...draft(), acquisitionCostEuros: undefined, acquisitionDate: undefined })
    )

    expect((saved as PhysicalAsset).acquisitionCost).toBeUndefined()
  })

  it("refuses a valuation that is not an amount rather than storing one", async () => {
    const outcome = await withStubs([], [], (stubs) =>
      Effect.result(addHolding({ ...draft(), resaleValueEuros: Number.NaN })).pipe(
        Effect.map((result) => ({ result, stored: stubs.holdings.inspect().holdings }))
      )
    )

    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.stored).toStrictEqual([])
  })
})

describe("recording a valuation", () => {
  it("adds to the history rather than replacing it (CAP-04)", async () => {
    const snapshots = await withStubs(
      [account()],
      [snapshot("s1", "a1", "2026-06-30", 20_000, "actual")],
      (stubs) =>
        recordValuation({
          holding: account(),
          date: TODAY,
          amountEuros: 24_000,
          today: TODAY,
          existing: undefined
        }).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    expect(snapshots.map((each) => Money.toEuros(each.amount))).toStrictEqual([20_000, 24_000])
  })

  it("becomes the holding's value from then on", async () => {
    const total = await withStubs(
      [account()],
      [snapshot("s1", "a1", "2026-06-30", 20_000, "actual")],
      () =>
        recordValuation({
          holding: account(),
          date: TODAY,
          amountEuros: 24_000,
          today: TODAY,
          existing: undefined
        }).pipe(Effect.flatMap(() => totalCapitalAt(date(TODAY))))
    )

    expect(total).toBe(euros(24_000))
  })

  it("refuses a future date, which is a typo rather than a forecast (CAP-04)", async () => {
    const outcome = await withStubs([account()], [], (stubs) =>
      Effect.result(
        recordValuation({
          holding: account(),
          date: "2027-01-31",
          amountEuros: 24_000,
          today: TODAY,
          existing: undefined
        })
      ).pipe(Effect.map((result) => ({ result, stored: stubs.valuations.inspect().snapshots })))
    )

    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.stored).toStrictEqual([])
  })

  it("accepts today itself, which is the common case", async () => {
    const outcome = await withStubs([account()], [], () =>
      Effect.result(
        recordValuation({
          holding: account(),
          date: TODAY,
          amountEuros: 24_000,
          today: TODAY,
          existing: undefined
        })
      )
    )

    expect(Result.isSuccess(outcome)).toBe(true)
  })

  it("takes its basis from the holding, not from the caller (CAP-06)", async () => {
    const snapshots = await withStubs([asset()], [], (stubs) =>
      recordValuation({
        holding: asset(),
        date: TODAY,
        amountEuros: 10_500,
        today: TODAY,
        existing: undefined
      }).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    expect(snapshots.map((each) => each.basis)).toStrictEqual(["estimated"])
  })

  it("corrects a mistyped snapshot in place when told which one", async () => {
    const snapshots = await withStubs(
      [account()],
      [snapshot("s1", "a1", TODAY, 240_000, "actual")],
      (stubs) =>
        recordValuation({
          holding: account(),
          date: TODAY,
          amountEuros: 24_000,
          today: TODAY,
          existing: balanceSnapshotId("s1")
        }).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    expect(snapshots.map((each) => Money.toEuros(each.amount))).toStrictEqual([24_000])
  })
})

describe("including and excluding a holding", () => {
  const both = () => [account(), asset()]
  const valued = () => [
    snapshot("s1", "a1", TODAY, 24_000, "actual"),
    snapshot("s2", "p1", TODAY, 11_000, "estimated")
  ]

  it("changes total capital without touching the holding or its history", async () => {
    const { total, stored, snapshots } = await withStubs(both(), valued(), (stubs) =>
      setHoldingIncluded(holdingId("p1"), false).pipe(
        Effect.flatMap(() => totalCapitalAt(date(TODAY))),
        Effect.map((total) => ({
          total,
          stored: stubs.holdings.inspect().holdings,
          snapshots: stubs.valuations.inspect().snapshots
        }))
      )
    )

    expect(total).toBe(euros(24_000))
    expect(stored).toHaveLength(2)
    expect(snapshots).toHaveLength(2)
  })

  it("gives €0 when everything is excluded — deliberate, not an error (CAP-07)", async () => {
    const total = await withStubs(both(), valued(), () =>
      setHoldingIncluded(holdingId("a1"), false).pipe(
        Effect.flatMap(() => setHoldingIncluded(holdingId("p1"), false)),
        Effect.flatMap(() => totalCapitalAt(date(TODAY)))
      )
    )

    expect(total).toBe(Money.zero)
  })

  it("puts a holding back without needing its value re-entered", async () => {
    const total = await withStubs(both(), valued(), () =>
      setHoldingIncluded(holdingId("p1"), false).pipe(
        Effect.flatMap(() => setHoldingIncluded(holdingId("p1"), true)),
        Effect.flatMap(() => totalCapitalAt(date(TODAY)))
      )
    )

    expect(total).toBe(euros(35_000))
  })
})

describe("deleting a holding", () => {
  it("removes it from capital for good, unlike excluding", async () => {
    const { total, stored } = await withStubs(
      [account(), asset()],
      [snapshot("s1", "a1", TODAY, 24_000, "actual")],
      (stubs) =>
        deleteHolding(holdingId("a1")).pipe(
          Effect.flatMap(() => totalCapitalAt(date(TODAY))),
          Effect.map((total) => ({ total, stored: stubs.holdings.inspect().holdings }))
        )
    )

    expect(total).toBe(Money.zero)
    expect(stored).toHaveLength(1)
  })
})

describe("the capital overview", () => {
  it("groups accounts and assets apart, since they are different kinds of fact", async () => {
    const overview = await withStubs(
      [account(), asset()],
      [
        snapshot("s1", "a1", TODAY, 24_000, "actual"),
        snapshot("s2", "p1", TODAY, 11_000, "estimated")
      ],
      () => capitalOverviewAt(date(TODAY))
    )

    expect(overview.accounts.map((each) => each.holding.name)).toStrictEqual([
      "Joint current account"
    ])
    expect(overview.assets.map((each) => each.holding.name)).toStrictEqual(["Dive watch"])
    expect(overview.total).toBe(euros(35_000))
  })

  it("keeps an excluded holding in its group, contributing nothing (spec §72)", async () => {
    const overview = await withStubs(
      [account(), asset({ includedInCapital: false })],
      [
        snapshot("s1", "a1", TODAY, 24_000, "actual"),
        snapshot("s2", "p1", TODAY, 11_000, "estimated")
      ],
      () => capitalOverviewAt(date(TODAY))
    )

    expect(overview.assets).toHaveLength(1)
    expect(overview.total).toBe(euros(24_000))
  })

  it("shows a holding with no valuation rather than hiding it", async () => {
    const overview = await withStubs([account()], [], () => capitalOverviewAt(date(TODAY)))

    expect(overview.accounts).toHaveLength(1)
    expect(overview.accounts.map((each) => each.valuation)).toStrictEqual([undefined])
  })
})

describe("the monthly routine", () => {
  const entries = (...amounts: ReadonlyArray<string>) => [
    { holding: account(), amountEuros: amounts[0] ?? "" },
    { holding: asset(), amountEuros: amounts[1] ?? "" }
  ]

  it("records several holdings in one pass (TRJ-05)", async () => {
    const snapshots = await withStubs([account(), asset()], [], (stubs) =>
      recordManyValuations({
        entries: entries("26000", "10500"),
        date: TODAY,
        today: TODAY
      }).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    expect(snapshots.map((each) => Money.toEuros(each.amount))).toStrictEqual([26_000, 10_500])
  })

  it("leaves a blank field alone rather than recording zero", async () => {
    const snapshots = await withStubs([account(), asset()], [], (stubs) =>
      recordManyValuations({
        entries: entries("26000", ""),
        date: TODAY,
        today: TODAY
      }).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    // A household checks two of four accounts in a month. Reading the empty
    // fields as €0 would wipe out half their capital on a routine visit.
    expect(snapshots).toHaveLength(1)
    expect(snapshots.map((each) => each.holdingId)).toStrictEqual(["a1"])
  })

  it("records nothing at all when every field is blank", async () => {
    const snapshots = await withStubs([account(), asset()], [], (stubs) =>
      recordManyValuations({ entries: entries(), date: TODAY, today: TODAY }).pipe(
        Effect.map(() => stubs.valuations.inspect().snapshots)
      )
    )

    expect(snapshots).toStrictEqual([])
  })

  it("takes each holding's own basis, so an asset stays an estimate", async () => {
    const snapshots = await withStubs([account(), asset()], [], (stubs) =>
      recordManyValuations({
        entries: entries("26000", "10500"),
        date: TODAY,
        today: TODAY
      }).pipe(Effect.map(() => stubs.valuations.inspect().snapshots))
    )

    expect(snapshots.map((each) => each.basis)).toStrictEqual(["actual", "estimated"])
  })

  it("refuses the whole pass on a future date rather than recording some of it", async () => {
    const outcome = await withStubs([account(), asset()], [], (stubs) =>
      Effect.result(
        recordManyValuations({
          entries: entries("26000", "10500"),
          date: "2027-01-31",
          today: TODAY
        })
      ).pipe(Effect.map((result) => ({ result, stored: stubs.valuations.inspect().snapshots })))
    )

    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.stored).toStrictEqual([])
  })
})
