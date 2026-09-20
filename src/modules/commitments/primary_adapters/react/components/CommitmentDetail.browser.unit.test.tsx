import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Result } from "effect"
import { describe, expect, it, vi } from "vitest"

import {
  commitmentId,
  Debt,
  ScheduledPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"
import { CommitmentTotals } from "@/modules/commitments/core/use_cases/CommitmentsOverviewQuery"
import { CommitmentDetailPanel } from "@/modules/commitments/primary_adapters/react/components/CommitmentDetailPanel"
import { DeleteCommitmentDialog } from "@/modules/commitments/primary_adapters/react/components/DeleteCommitmentDialog"
import { householdId } from "@/modules/household/core/domain/Household"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"
import * as YearMonth from "@/shared/domain/YearMonth"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))

const totals = () =>
  new CommitmentTotals({
    monthly: euros(2_180),
    scheduledTax: euros(21_215),
    oneOff: Money.zero,
    outstandingDebt: euros(7_200)
  })

const debt = () =>
  new Debt({
    id: commitmentId("d1"),
    householdId: householdId("h1"),
    name: "Card debt",
    initialAmount: euros(11_000),
    interestRate: Percentage.zero,
    regularPaymentAmount: euros(900),
    startDate: date("2026-01-01"),
    enabled: true
  })

const tax = () =>
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
    enabled: true
  })

const panel = (props: Partial<Parameters<typeof CommitmentDetailPanel>[0]> = {}) => (
  <CommitmentDetailPanel
    commitment={undefined}
    position={undefined}
    totals={totals()}
    onEdit={() => {}}
    onDelete={() => {}}
    busy={false}
    balances={null}
    {...props}
  />
)

describe("the detail panel with nothing selected", () => {
  it("holds the totals rather than collapsing (CMT-12)", () => {
    render(panel())

    expect(screen.getByText(/what this adds up to/i)).toBeInTheDocument()
    expect(screen.getByText(/select a commitment/i)).toBeInTheDocument()
  })

  it("keeps monthly and scheduled tax apart, and says why", () => {
    render(panel())

    expect(screen.getByText("Every month")).toBeInTheDocument()
    expect(screen.getByText("Scheduled tax")).toBeInTheDocument()
    expect(screen.getByText(/not part of the monthly figure/i)).toBeInTheDocument()
  })

  it("never shows the two added together", () => {
    render(panel())

    expect(screen.queryByText("€23,395")).not.toBeInTheDocument()
  })
})

describe("a debt in the detail panel (spec §23)", () => {
  const position = () =>
    new DebtPosition({ remaining: euros(7_200), from: ym("2027-01"), fromSnapshot: true })

  it("shows initial against remaining", () => {
    render(panel({ commitment: debt(), position: position() }))

    expect(screen.getByText(/€11,000 → €7,200/)).toBeInTheDocument()
  })

  it("shows the repaid share as a bar and as a number", () => {
    render(panel({ commitment: debt(), position: position() }))

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "35")
    expect(screen.getByText(/35% repaid/)).toBeInTheDocument()
  })

  it("shows the payment, the months left and the payoff month", () => {
    render(panel({ commitment: debt(), position: position() }))

    expect(screen.getByText("€900")).toBeInTheDocument()
    expect(screen.getByText("8 months")).toBeInTheDocument()
    expect(screen.getByText("August 2027")).toBeInTheDocument()
  })

  it("says the balance came from a recorded one, not from its own forecast", () => {
    render(panel({ commitment: debt(), position: position() }))

    expect(screen.getByText(/from the balance you recorded/i)).toBeInTheDocument()
  })

  it("says plainly that a rate is recorded but not compounded", () => {
    const withInterest = new Debt({
      ...debt(),
      interestRate: Result.getOrThrow(Percentage.fromPercent(4.5))
    })
    render(panel({ commitment: withInterest, position: position() }))

    expect(screen.getByText(/records the rate but does not compound it/i)).toBeInTheDocument()
  })
})

describe("a tax liability in the detail panel", () => {
  it("shows every dated payment, uneven final instalment included (spec §25)", () => {
    render(panel({ commitment: tax() }))

    expect(screen.getAllByText("€5,303")).toHaveLength(3)
    expect(screen.getByText("€5,306")).toBeInTheDocument()
    expect(screen.getByText("15 Dec 2026")).toBeInTheDocument()
  })

  it("says the schedule is not a monthly average", () => {
    render(panel({ commitment: tax() }))

    expect(screen.getByText(/not as a monthly average/i)).toBeInTheDocument()
  })
})

describe("deleting a commitment", () => {
  it("names what is lost and what it does to the target date (CMT-10)", () => {
    render(
      <DeleteCommitmentDialog
        name="Rent"
        isDebt={false}
        busy={false}
        error={undefined}
        onConfirm={() => {}}
        onDisableInstead={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.getByText(/gone for good/i)).toBeInTheDocument()
    expect(screen.getByText(/reach the goal sooner/i)).toBeInTheDocument()
  })

  it("warns that a debt's recorded balances go with it", () => {
    render(
      <DeleteCommitmentDialog
        name="Card debt"
        isDebt
        busy={false}
        error={undefined}
        onConfirm={() => {}}
        onDisableInstead={() => {}}
        onCancel={() => {}}
      />
    )

    expect(
      screen.getByText(/balance you recorded against this debt is deleted/i)
    ).toBeInTheDocument()
  })

  it("offers switching off as the reversible alternative", async () => {
    const onDisableInstead = vi.fn<() => void>()
    render(
      <DeleteCommitmentDialog
        name="Rent"
        isDebt={false}
        busy={false}
        error={undefined}
        onConfirm={() => {}}
        onDisableInstead={onDisableInstead}
        onCancel={() => {}}
      />
    )

    expect(screen.getByText(/keeps the record and can be undone/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /switch off instead/i }))

    expect(onDisableInstead).toHaveBeenCalledOnce()
  })
})
