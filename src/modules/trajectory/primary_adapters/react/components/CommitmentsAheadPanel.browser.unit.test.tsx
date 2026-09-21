import { render, screen } from "@testing-library/react"
import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { CommitmentsAheadPanel } from "@/modules/trajectory/primary_adapters/react/components/CommitmentsAheadPanel"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type {
  DebtAhead,
  TaxAhead
} from "@/modules/trajectory/primary_adapters/react/CommitmentsAhead"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))

const debt = (over: Partial<DebtAhead> = {}): DebtAhead => ({
  kind: "debt",
  id: "debt-1",
  name: "Card debt",
  remaining: euros(8_500),
  initial: euros(13_000),
  percentRepaid: 35,
  monthly: euros(1_083),
  monthsLeft: 8,
  ...over
})

const tax = (over: Partial<TaxAhead> = {}): TaxAhead => ({
  kind: "tax",
  id: "tax-1",
  name: "2025 income tax",
  status: "confirmed",
  nextAmount: euros(6_413),
  nextDate: date("2026-11-26"),
  payment: 3,
  payments: 4,
  stillScheduled: euros(12_828),
  total: euros(25_654),
  ...over
})

describe("the debt card", () => {
  it("gives what is left against what was owed, and how far along that is", () => {
    render(<CommitmentsAheadPanel commitments={[debt()]} />)

    expect(screen.getByText("€8,500")).toBeInTheDocument()
    expect(screen.getByText(/remaining of €13,000/i)).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "35")
    expect(screen.getByText(/35% repaid/i)).toBeInTheDocument()
  })

  it("states the payment and how many are left", () => {
    render(<CommitmentsAheadPanel commitments={[debt()]} />)

    expect(screen.getByText(/€1,083 \/ month · ~8 months left/i)).toBeInTheDocument()
  })

  it("counts a single remaining month in the singular", () => {
    render(<CommitmentsAheadPanel commitments={[debt({ monthsLeft: 1 })]} />)

    expect(screen.getByText(/~1 month left/i)).toBeInTheDocument()
  })

  it("offers a way to record the actual balance", () => {
    render(<CommitmentsAheadPanel commitments={[debt()]} />)

    expect(screen.getByRole("link", { name: /record actual balance/i })).toBeInTheDocument()
  })
})

describe("the tax card", () => {
  it("gives the next payment, its date and where it sits in the schedule", () => {
    render(<CommitmentsAheadPanel commitments={[tax()]} />)

    expect(screen.getByText("€6,413")).toBeInTheDocument()
    expect(screen.getByText(/due 26 nov 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/next tax payment · payment 3 of 4/i)).toBeInTheDocument()
    expect(screen.getByText(/€12,828 of €25,654 still scheduled/i)).toBeInTheDocument()
  })

  it("marks a confirmed bill as confirmed", () => {
    render(<CommitmentsAheadPanel commitments={[tax()]} />)

    expect(screen.getByText(/confirmed/i)).toBeInTheDocument()
  })

  it("heads each card with its own liability, so two never read alike", () => {
    render(
      <CommitmentsAheadPanel
        commitments={[tax(), tax({ id: "tax-2", name: "2026 tax catch-up" })]}
      />
    )

    expect(screen.getByText("2025 income tax")).toBeInTheDocument()
    expect(screen.getByText("2026 tax catch-up")).toBeInTheDocument()
  })

  it("never renders an estimate with a confirmed amount's authority (spec §26)", () => {
    render(<CommitmentsAheadPanel commitments={[tax({ status: "estimated" })]} />)

    expect(screen.getByText("~€6,413")).toBeInTheDocument()
    expect(screen.getByText(/estimated/i)).toBeInTheDocument()
  })

  it("says so plainly when the schedule has run out", () => {
    render(
      <CommitmentsAheadPanel
        commitments={[tax({ nextAmount: undefined, nextDate: undefined, payment: undefined })]}
      />
    )

    expect(screen.getByText(/nothing due/i)).toBeInTheDocument()
  })
})

describe("with nothing that ends", () => {
  it("reads as good news rather than a section that failed to load", () => {
    render(<CommitmentsAheadPanel commitments={[]} />)

    expect(screen.getByText(/no debts or scheduled tax/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing with a finish line/i)).toBeInTheDocument()
  })
})
