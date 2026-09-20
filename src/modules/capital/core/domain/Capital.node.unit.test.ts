import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { BalanceSnapshot, balanceSnapshotId } from "@/modules/capital/core/domain/BalanceSnapshot"
import {
  BankAccount,
  basisOf,
  countsTowardCapital,
  holdingId,
  PhysicalAsset
} from "@/modules/capital/core/domain/Holding"
import { totalOf, valueHoldings } from "@/modules/capital/core/domain/TotalCapital"
import { isStale, valuationAt } from "@/modules/capital/core/domain/Valuation"
import { householdId } from "@/modules/household/core/domain/Household"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { Holding } from "@/modules/capital/core/domain/Holding"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const home = householdId("h1")

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

const total = (
  holdings: ReadonlyArray<Holding>,
  snapshots: ReadonlyArray<BalanceSnapshot>,
  on = "2026-09-30"
) => totalOf(valueHoldings(holdings, snapshots, date(on)))

describe("what a holding is worth", () => {
  it("is its latest snapshot on or before the date (spec §2.3, §71)", () => {
    const snapshots = [
      snapshot("s1", "a1", "2026-06-30", 20_000, "actual"),
      snapshot("s2", "a1", "2026-09-30", 24_000, "actual")
    ]

    expect(valuationAt(snapshots, date("2026-09-30"))?.amount).toBe(euros(24_000))
  })

  it("ignores a snapshot dated after the date asked about", () => {
    const snapshots = [
      snapshot("s1", "a1", "2026-06-30", 20_000, "actual"),
      snapshot("s2", "a1", "2026-12-31", 30_000, "actual")
    ]

    expect(valuationAt(snapshots, date("2026-09-30"))?.amount).toBe(euros(20_000))
  })

  it("is absent, not an error, when nothing has been recorded", () => {
    expect(valuationAt([], date("2026-09-30"))).toBeUndefined()
  })

  it("carries the basis it was recorded with", () => {
    const snapshots = [snapshot("s1", "p1", "2026-09-30", 11_000, "estimated")]

    expect(valuationAt(snapshots, date("2026-09-30"))?.basis).toBe("estimated")
  })

  it("reads as stale past a year, because a year-old guess is a weaker claim", () => {
    const old = valuationAt(
      [snapshot("s1", "p1", "2025-01-31", 11_000, "estimated")],
      date("2026-09-30")
    )!
    const recent = valuationAt(
      [snapshot("s2", "p1", "2026-06-30", 11_000, "estimated")],
      date("2026-09-30")
    )!

    expect(isStale(old, date("2026-09-30"))).toBe(true)
    expect(isStale(recent, date("2026-09-30"))).toBe(false)
  })
})

describe("the basis of a valuation", () => {
  it("follows the kind rather than a caller's choice (spec §71)", () => {
    expect(basisOf(account())).toBe("actual")
    expect(basisOf(asset())).toBe("estimated")
  })
})

describe("total capital", () => {
  it("sums the latest valuation of every included holding (spec §73)", () => {
    const snapshots = [
      snapshot("s1", "a1", "2026-09-30", 24_000, "actual"),
      snapshot("s2", "p1", "2026-09-30", 11_000, "estimated")
    ]

    expect(total([account(), asset()], snapshots)).toBe(euros(35_000))
  })

  it("is gross: nothing here can subtract debt, because nothing here knows of it", () => {
    const snapshots = [snapshot("s2", "p1", "2026-09-30", 15_000, "estimated")]

    // §77's example: a €15,000 asset with €9,500 still owed against it.
    // Capital is €15,000. The €9,500 arrives as cash flows, not as a deduction.
    expect(total([asset()], snapshots)).toBe(euros(15_000))
  })

  it("counts nothing from an excluded holding, which stays in the list (spec §72)", () => {
    const snapshots = [
      snapshot("s1", "a1", "2026-09-30", 24_000, "actual"),
      snapshot("s2", "p1", "2026-09-30", 11_000, "estimated")
    ]

    expect(total([account(), asset({ includedInCapital: false })], snapshots)).toBe(euros(24_000))
  })

  it("counts nothing from a disabled holding either", () => {
    const snapshots = [snapshot("s1", "a1", "2026-09-30", 24_000, "actual")]

    expect(total([account({ enabled: false })], snapshots)).toBe(Money.zero)
  })

  it("gives €0 when everything is excluded — a deliberate answer (CAP-07)", () => {
    const snapshots = [
      snapshot("s1", "a1", "2026-09-30", 24_000, "actual"),
      snapshot("s2", "p1", "2026-09-30", 11_000, "estimated")
    ]

    const none = [account({ includedInCapital: false }), asset({ includedInCapital: false })]
    expect(total(none, snapshots)).toBe(Money.zero)
  })

  it("counts a holding with no valuation as zero rather than failing (CAP-10)", () => {
    expect(total([account(), asset()], [])).toBe(Money.zero)
  })

  it("accepts an overdrawn account, because overdrafts are real (CAP-03)", () => {
    const snapshots = [
      snapshot("s1", "a1", "2026-09-30", -450, "actual"),
      snapshot("s2", "p1", "2026-09-30", 11_000, "estimated")
    ]

    expect(total([account(), asset()], snapshots)).toBe(euros(10_550))
  })

  it("behaves exactly as the old single-savings model with one account (spec §71)", () => {
    const snapshots = [snapshot("s1", "a1", "2026-09-30", 24_000, "actual")]

    expect(total([account()], snapshots)).toBe(euros(24_000))
  })

  it("never lets acquisition cost reach capital (spec §78)", () => {
    const snapshots = [snapshot("s2", "p1", "2026-09-30", 11_000, "estimated")]

    // Bought for €9,000, carried at €11,000. Capital is the valuation alone.
    expect(total([asset()], snapshots)).toBe(euros(11_000))
  })
})

describe("whether a holding counts", () => {
  it("needs both enabled and included", () => {
    expect(countsTowardCapital(account())).toBe(true)
    expect(countsTowardCapital(account({ includedInCapital: false }))).toBe(false)
    expect(countsTowardCapital(account({ enabled: false }))).toBe(false)
  })
})
