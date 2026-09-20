import { Effect, Layer, Result } from "effect"
import { describe, expect, it } from "vitest"

import {
  commitmentId,
  Debt,
  RecurringExpense,
  ScheduledPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import { DebtSnapshot, debtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import { commitmentCashFlowsBetween } from "@/modules/commitments/core/use_cases/CommitmentCashFlowsQuery"
import { commitmentsOverview } from "@/modules/commitments/core/use_cases/CommitmentsOverviewQuery"
import { deleteCommitment } from "@/modules/commitments/core/use_cases/DeleteCommitmentUseCase"
import { recordDebtBalance } from "@/modules/commitments/core/use_cases/RecordDebtBalanceUseCase"
import { saveCommitment } from "@/modules/commitments/core/use_cases/SaveCommitmentUseCase"
import { setCommitmentEnabled } from "@/modules/commitments/core/use_cases/SetCommitmentEnabledUseCase"
import { makeCommitmentsStub } from "@/modules/commitments/secondary_adapters/CommitmentsStub"
import { makeDebtHistoryStub } from "@/modules/commitments/secondary_adapters/DebtHistoryStub"
import { householdId } from "@/modules/household/core/domain/Household"
import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { Commitment } from "@/modules/commitments/core/domain/Commitment"
import type { DebtSnapshot as Snapshot } from "@/modules/commitments/core/domain/DebtSnapshot"
import type { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import type { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const home = householdId("h1")

const withStubs = <A, E>(
  commitments: ReadonlyArray<Commitment>,
  snapshots: ReadonlyArray<Snapshot>,
  use: (stubs: {
    readonly commitments: ReturnType<typeof makeCommitmentsStub>
    readonly history: ReturnType<typeof makeDebtHistoryStub>
  }) => Effect.Effect<A, E, typeof Commitments.Identifier | typeof DebtHistory.Identifier>
): Promise<A> => {
  const stubs = {
    commitments: makeCommitmentsStub({ commitments }),
    history: makeDebtHistoryStub({ snapshots })
  }
  return Effect.runPromise(
    Effect.provide(use(stubs), Layer.mergeAll(stubs.commitments.layer, stubs.history.layer))
  )
}

const rent = () =>
  new RecurringExpense({
    id: commitmentId("r1"),
    householdId: home,
    name: "Rent",
    amount: euros(1_280),
    period: Result.getOrThrow(ActivePeriod.make(date("2026-09-01"), undefined)),
    enabled: true
  })

const debt = () =>
  new Debt({
    id: commitmentId("d1"),
    householdId: home,
    name: "Card debt",
    initialAmount: euros(11_000),
    interestRate: Percentage.zero,
    regularPaymentAmount: euros(900),
    startDate: date("2026-09-01"),
    enabled: true
  })

const tax = () =>
  new TaxLiability({
    id: commitmentId("t1"),
    householdId: home,
    name: "2025 income tax",
    taxYear: 2025,
    status: "confirmed",
    amount: euros(21_215),
    paymentSchedule: [new ScheduledPayment({ date: date("2026-09-15"), amount: euros(21_215) })],
    enabled: true
  })

describe("saving a commitment", () => {
  it("validates a draft on the way in rather than storing a bad one", async () => {
    const outcome = await withStubs([], [], (stubs) =>
      Effect.result(
        saveCommitment({
          kind: "RecurringExpense",
          household: home,
          name: "Rent",
          amountEuros: Number.NaN,
          startDate: "2026-09-01",
          endDate: undefined
        })
      ).pipe(Effect.map((result) => ({ result, stored: stubs.commitments.inspect().commitments })))
    )

    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.stored).toStrictEqual([])
  })

  it("refuses a date the picker could not have produced", async () => {
    const outcome = await withStubs([], [], () =>
      Effect.result(
        saveCommitment({
          kind: "OneOffExpense",
          household: home,
          name: "Kitchen",
          amountEuros: 15_000,
          date: "2026-13-04"
        })
      )
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("accepts a debt at 0%, which is valid and common", async () => {
    const saved = await withStubs([], [], () =>
      saveCommitment({
        kind: "Debt",
        household: home,
        name: "Family loan",
        initialAmountEuros: 4_000,
        interestRatePercent: 0,
        regularPaymentEuros: 200,
        startDate: "2026-09-01"
      })
    )

    expect(saved).toBeInstanceOf(Debt)
    expect(Percentage.toBasisPoints((saved as Debt).interestRate)).toBe(0)
  })

  it("keeps a tax schedule as given, uneven final instalment and all", async () => {
    const saved = await withStubs([], [], () =>
      saveCommitment({
        kind: "TaxLiability",
        household: home,
        name: "2025 income tax",
        taxYear: 2025,
        status: "confirmed",
        amountEuros: 21_215,
        schedule: [
          { date: "2026-09-15", amountEuros: 5_303 },
          { date: "2026-12-15", amountEuros: 5_306 }
        ]
      })
    )

    expect(
      (saved as TaxLiability).paymentSchedule.map((each) => Money.toEuros(each.amount))
    ).toStrictEqual([5_303, 5_306])
  })

  it("edits in place rather than adding a second row", async () => {
    const stored = await withStubs([rent()], [], (stubs) =>
      saveCommitment(
        {
          kind: "RecurringExpense",
          household: home,
          name: "Rent",
          amountEuros: 1_400,
          startDate: "2026-09-01",
          endDate: undefined
        },
        commitmentId("r1")
      ).pipe(Effect.map(() => stubs.commitments.inspect().commitments))
    )

    expect(stored).toHaveLength(1)
    expect(Money.toEuros((stored[0] as RecurringExpense).amount)).toBe(1_400)
  })
})

describe("switching a commitment off", () => {
  it("stops its cash flows without removing it (spec §18)", async () => {
    const { flows, stored } = await withStubs([rent()], [], (stubs) =>
      setCommitmentEnabled(commitmentId("r1"), false).pipe(
        Effect.flatMap(() => commitmentCashFlowsBetween(ym("2026-09"), ym("2026-12"))),
        Effect.map((flows) => ({ flows, stored: stubs.commitments.inspect().commitments }))
      )
    )

    expect(flows).toStrictEqual([])
    expect(stored).toHaveLength(1)
  })
})

describe("deleting a commitment", () => {
  it("removes it for good, unlike disabling", async () => {
    const stored = await withStubs([rent()], [], (stubs) =>
      deleteCommitment(commitmentId("r1")).pipe(
        Effect.map(() => stubs.commitments.inspect().commitments)
      )
    )

    expect(stored).toStrictEqual([])
  })
})

describe("recording a debt balance", () => {
  it("adds to the history rather than replacing it (spec §21)", async () => {
    const existing = new DebtSnapshot({
      id: debtSnapshotId("s1"),
      debtId: commitmentId("d1"),
      date: date("2026-06-30"),
      remainingAmount: euros(9_000)
    })

    const history = await withStubs([debt()], [existing], (stubs) =>
      recordDebtBalance({
        debt: commitmentId("d1"),
        date: "2026-12-31",
        remainingEuros: 7_200,
        existing: undefined
      }).pipe(Effect.map(() => stubs.history.inspect().snapshots))
    )

    expect(history.map((each) => Money.toEuros(each.remainingAmount))).toStrictEqual([9_000, 7_200])
  })

  it("makes the recorded balance the source of truth for what follows", async () => {
    const flows = await withStubs([debt()], [], () =>
      recordDebtBalance({
        debt: commitmentId("d1"),
        date: "2026-12-31",
        remainingEuros: 7_200,
        existing: undefined
      }).pipe(Effect.flatMap(() => commitmentCashFlowsBetween(ym("2026-09"), ym("2028-12"))))
    )

    // €7,200 at €900 a month, starting the month after the snapshot.
    expect(Money.toEuros(Money.sum(flows.map((flow) => flow.amount)))).toBe(-7_200)
    expect(flows.map((flow) => LocalDate.toIso(flow.date))[0]).toBe("2027-01-31")
  })

  it("corrects an earlier snapshot in place when told which one", async () => {
    const existing = new DebtSnapshot({
      id: debtSnapshotId("s1"),
      debtId: commitmentId("d1"),
      date: date("2026-12-31"),
      remainingAmount: euros(9_000)
    })

    const history = await withStubs([debt()], [existing], (stubs) =>
      recordDebtBalance({
        debt: commitmentId("d1"),
        date: "2026-12-31",
        remainingEuros: 7_200,
        existing: debtSnapshotId("s1")
      }).pipe(Effect.map(() => stubs.history.inspect().snapshots))
    )

    expect(history.map((each) => Money.toEuros(each.remainingAmount))).toStrictEqual([7_200])
  })
})

describe("the commitments overview", () => {
  it("keeps monthly and scheduled tax apart, since adding them is true of no month", async () => {
    const overview = await withStubs([rent(), debt(), tax()], [], () => commitmentsOverview)

    expect(Money.toEuros(overview.totals.monthly)).toBe(1_280 + 900)
    expect(Money.toEuros(overview.totals.scheduledTax)).toBe(21_215)
  })

  it("leaves a disabled commitment out of the totals but in the list", async () => {
    const overview = await withStubs(
      [new RecurringExpense({ ...rent(), enabled: false }), debt()],
      [],
      () => commitmentsOverview
    )

    expect(overview.commitments).toHaveLength(2)
    expect(Money.toEuros(overview.totals.monthly)).toBe(900)
  })

  it("reports outstanding debt from the recorded balance, not the initial amount", async () => {
    const snapshot = new DebtSnapshot({
      id: debtSnapshotId("s1"),
      debtId: commitmentId("d1"),
      date: date("2026-12-31"),
      remainingAmount: euros(7_200)
    })

    const overview = await withStubs([debt()], [snapshot], () => commitmentsOverview)

    expect(Money.toEuros(overview.totals.outstandingDebt)).toBe(7_200)
  })
})

describe("the commitments cash flow seam", () => {
  it("is every kind together, each carrying its own source for drill-down", async () => {
    const flows = await withStubs([rent(), debt(), tax()], [], () =>
      commitmentCashFlowsBetween(ym("2026-09"), ym("2026-09"))
    )

    expect(flows.map((flow) => flow.sourceKind).sort()).toStrictEqual(["debt", "expense", "tax"])
    expect(flows.every((flow) => Money.isNegative(flow.amount))).toBe(true)
  })

  it("adds a fourth commitment without the query learning what it is", async () => {
    const flows = await withStubs(
      [rent(), new RecurringExpense({ ...rent(), id: commitmentId("r2"), name: "Support" })],
      [],
      () => commitmentCashFlowsBetween(ym("2026-09"), ym("2026-09"))
    )

    expect(flows).toHaveLength(2)
  })
})
