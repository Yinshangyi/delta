import { Result } from "effect"
import { describe, expect, it } from "vitest"

import {
  commitmentId,
  Debt,
  OneOffExpense,
  RecurringExpense,
  RecurringTaxPayment,
  ScheduledPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import { cashFlowsFor } from "@/modules/commitments/core/domain/CommitmentCashFlows"
import { DebtPosition, positionOf } from "@/modules/commitments/core/domain/DebtPosition"
import { DebtSnapshot, debtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import { householdId, personId } from "@/modules/household/core/domain/Household"
import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const period = (start: string, end?: string) =>
  Result.getOrThrow(ActivePeriod.make(date(start), end === undefined ? undefined : date(end)))

const noPositions = () => new Map<CommitmentId, DebtPosition>()

const rent = (overrides: Partial<ConstructorParameters<typeof RecurringExpense>[0]> = {}) =>
  new RecurringExpense({
    id: commitmentId("r1"),
    householdId: householdId("h1"),
    name: "Rent",
    amount: euros(1_280),
    period: period("2026-09-01"),
    enabled: true,
    ...overrides
  })

const debt = (overrides: Partial<ConstructorParameters<typeof Debt>[0]> = {}) =>
  new Debt({
    id: commitmentId("d1"),
    householdId: householdId("h1"),
    name: "Card debt",
    initialAmount: euros(11_000),
    interestRate: Percentage.zero,
    regularPaymentAmount: euros(900),
    startDate: date("2026-01-01"),
    enabled: true,
    ...overrides
  })

const tax = (overrides: Partial<ConstructorParameters<typeof TaxLiability>[0]> = {}) =>
  new TaxLiability({
    id: commitmentId("t1"),
    householdId: householdId("h1"),
    name: "2025 income tax",
    taxYear: 2025,
    status: "confirmed",
    amount: euros(21_215),
    paymentSchedule: [
      new ScheduledPayment({ date: date("2026-09-15"), amount: euros(5_303) }),
      new ScheduledPayment({ date: date("2026-10-15"), amount: euros(5_303) }),
      new ScheduledPayment({ date: date("2026-11-15"), amount: euros(5_303) }),
      new ScheduledPayment({ date: date("2026-12-15"), amount: euros(5_306) })
    ],
    enabled: true,
    ...overrides
  })

describe("a recurring expense", () => {
  it("is one outflow a month, never two (spec §18)", () => {
    const flows = cashFlowsFor(rent(), noPositions(), ym("2026-09"), ym("2026-11"))

    expect(flows).toHaveLength(3)
    expect(flows.map((flow) => Money.toEuros(flow.amount))).toStrictEqual([-1_280, -1_280, -1_280])
  })

  it("leaves money as a negative flow, whatever sign it was stored with", () => {
    const flows = cashFlowsFor(rent(), noPositions(), ym("2026-09"), ym("2026-09"))

    expect(flows.every((flow) => Money.isNegative(flow.amount))).toBe(true)
  })

  it("produces nothing outside its active range", () => {
    const ending = rent({ period: period("2026-09-01", "2026-10-31") })
    const flows = cashFlowsFor(ending, noPositions(), ym("2026-08"), ym("2026-12"))

    expect(flows.map((flow) => LocalDate.toIso(flow.date))).toStrictEqual([
      "2026-09-30",
      "2026-10-31"
    ])
  })
})

describe("a one-off expense", () => {
  const purchase = new OneOffExpense({
    id: commitmentId("o1"),
    householdId: householdId("h1"),
    name: "Kitchen",
    amount: euros(15_000),
    date: date("2026-12-04"),
    enabled: true
  })

  it("touches only its own month (spec §19)", () => {
    const flows = cashFlowsFor(purchase, noPositions(), ym("2026-01"), ym("2027-12"))

    expect(flows.map((flow) => LocalDate.toIso(flow.date))).toStrictEqual(["2026-12-04"])
    expect(flows.map((flow) => Money.toEuros(flow.amount))).toStrictEqual([-15_000])
  })

  it("is absent from a range it falls outside", () => {
    expect(cashFlowsFor(purchase, noPositions(), ym("2027-01"), ym("2027-12"))).toStrictEqual([])
  })
})

describe("a debt", () => {
  const positionsFor = (snapshots: ReadonlyArray<DebtSnapshot>) =>
    new Map([[commitmentId("d1"), positionOf(debt(), snapshots)]])

  it("repays from the initial amount when nothing has been recorded", () => {
    const flows = cashFlowsFor(debt(), positionsFor([]), ym("2026-01"), ym("2026-03"))

    expect(flows.map((flow) => Money.toEuros(flow.amount))).toStrictEqual([-900, -900, -900])
  })

  it("continues from a recorded balance rather than its own forecast (spec §21)", () => {
    const snapshot = new DebtSnapshot({
      id: debtSnapshotId("s1"),
      debtId: commitmentId("d1"),
      date: date("2026-12-31"),
      remainingAmount: euros(7_200)
    })

    const flows = cashFlowsFor(debt(), positionsFor([snapshot]), ym("2026-01"), ym("2027-12"))

    // Nothing before the snapshot: that is history, already paid.
    expect(flows.map((flow) => LocalDate.toIso(flow.date))[0]).toBe("2027-01-31")
    expect(flows).toHaveLength(8)
    expect(Money.toEuros(Money.sum(flows.map((flow) => flow.amount)))).toBe(-7_200)
  })

  it("takes the newest snapshot when several exist, not the last one stored", () => {
    const snapshots = [
      new DebtSnapshot({
        id: debtSnapshotId("s2"),
        debtId: commitmentId("d1"),
        date: date("2026-06-30"),
        remainingAmount: euros(9_000)
      }),
      new DebtSnapshot({
        id: debtSnapshotId("s1"),
        debtId: commitmentId("d1"),
        date: date("2026-12-31"),
        remainingAmount: euros(7_200)
      })
    ]

    const flows = cashFlowsFor(debt(), positionsFor(snapshots), ym("2026-01"), ym("2027-12"))

    expect(Money.toEuros(Money.sum(flows.map((flow) => flow.amount)))).toBe(-7_200)
  })

  it("stops once it is paid off rather than billing a cleared loan (spec §22)", () => {
    const nearlyDone = new DebtSnapshot({
      id: debtSnapshotId("s1"),
      debtId: commitmentId("d1"),
      date: date("2026-12-31"),
      remainingAmount: euros(400)
    })

    const flows = cashFlowsFor(debt(), positionsFor([nearlyDone]), ym("2027-01"), ym("2030-12"))

    expect(flows.map((flow) => Money.toEuros(flow.amount))).toStrictEqual([-400])
  })
})

describe("a tax liability", () => {
  it("lands its schedule on the configured dates, unaveraged (spec §25)", () => {
    const flows = cashFlowsFor(tax(), noPositions(), ym("2026-01"), ym("2027-12"))

    expect(flows.map((flow) => LocalDate.toIso(flow.date))).toStrictEqual([
      "2026-09-15",
      "2026-10-15",
      "2026-11-15",
      "2026-12-15"
    ])
    expect(flows.map((flow) => Money.toEuros(flow.amount))).toStrictEqual([
      -5_303, -5_303, -5_303, -5_306
    ])
  })

  it("keeps the uneven final instalment, which is why the schedule exists", () => {
    const flows = cashFlowsFor(tax(), noPositions(), ym("2026-12"), ym("2026-12"))

    expect(flows.map((flow) => Money.toEuros(flow.amount))).toStrictEqual([-5_306])
  })

  it("emits an estimated liability exactly as a confirmed one, since it is still owed", () => {
    const estimated = tax({ status: "estimated" })

    expect(cashFlowsFor(estimated, noPositions(), ym("2026-01"), ym("2027-12"))).toHaveLength(4)
  })
})

describe("a recurring tax payment", () => {
  const pas = new RecurringTaxPayment({
    id: commitmentId("p1"),
    householdId: householdId("h1"),
    personId: personId("person-1"),
    name: "BNC/PAS",
    amount: euros(1_600),
    period: period("2026-09-01"),
    enabled: true
  })

  it("is one outflow a month, labelled apart from a tax liability (spec §27)", () => {
    const flows = cashFlowsFor(pas, noPositions(), ym("2026-09"), ym("2026-11"))

    expect(flows).toHaveLength(3)
    expect(flows.every((flow) => flow.sourceKind === "tax-payment")).toBe(true)
  })

  it("models a rate change as one rule ending and another starting", () => {
    const old = new RecurringTaxPayment({ ...pas, period: period("2026-09-01", "2026-09-30") })
    const replacement = new RecurringTaxPayment({
      ...pas,
      id: commitmentId("p2"),
      amount: euros(1_800),
      period: period("2026-10-01")
    })

    const flows = [old, replacement].flatMap((rule) =>
      cashFlowsFor(rule, noPositions(), ym("2026-09"), ym("2026-11"))
    )

    expect(flows.map((flow) => Money.toEuros(flow.amount))).toStrictEqual([-1_600, -1_800, -1_800])
  })
})

describe("every kind", () => {
  it("produces nothing at all when disabled", () => {
    const off = [rent({ enabled: false }), debt({ enabled: false }), tax({ enabled: false })]

    for (const commitment of off) {
      expect(cashFlowsFor(commitment, noPositions(), ym("2026-01"), ym("2027-12"))).toStrictEqual(
        []
      )
    }
  })

  it("carries its own source id and kind, so a month can be drilled into", () => {
    const flows = cashFlowsFor(rent(), noPositions(), ym("2026-09"), ym("2026-09"))

    expect(flows.map((flow) => flow.sourceId)).toStrictEqual(["r1"])
    expect(flows.map((flow) => flow.sourceKind)).toStrictEqual(["expense"])
  })
})
