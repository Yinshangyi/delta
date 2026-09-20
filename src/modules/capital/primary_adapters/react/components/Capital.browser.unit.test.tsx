import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Result } from "effect"
import { describe, expect, it, vi } from "vitest"

import { CapitalHeadline } from "@/modules/capital/primary_adapters/react/components/CapitalHeadline"
import { DeleteHoldingDialog } from "@/modules/capital/primary_adapters/react/components/DeleteHoldingDialog"
import { HoldingDetailPanel } from "@/modules/capital/primary_adapters/react/components/HoldingDetailPanel"
import { HoldingGroup } from "@/modules/capital/primary_adapters/react/components/HoldingGroup"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { HoldingSummary } from "@/modules/capital/primary_adapters/react/HoldingSummary"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))

const summary = (overrides: Partial<HoldingSummary> = {}): HoldingSummary => ({
  id: "a1" as HoldingId,
  name: "Joint current account",
  subtitle: "A bank",
  value: "€24,000",
  asOf: "as of 30 Sep 2026",
  estimated: false,
  stale: false,
  included: true,
  counted: true,
  ...overrides
})

const group = (props: Partial<Parameters<typeof HoldingGroup>[0]> = {}) => (
  <HoldingGroup
    title="Accounts"
    summaries={[summary()]}
    selected={undefined}
    onSelect={() => {}}
    onToggleIncluded={() => {}}
    addLabel="Add account"
    onAdd={() => {}}
    busy={false}
    {...props}
  />
)

describe("the capital headline", () => {
  it("leads with capital, because capital drives the target date (spec §77)", () => {
    render(
      <CapitalHeadline
        total={euros(35_000)}
        netWorth={undefined}
        targetDate={ym("2027-08")}
        hasGoal
      />
    )

    expect(screen.getByText("€35,000")).toBeInTheDocument()
    expect(screen.getByText(/the projection's starting balance/i)).toBeInTheDocument()
  })

  it("shows the target date on this screen, where the question is being asked", () => {
    render(
      <CapitalHeadline
        total={euros(35_000)}
        netWorth={undefined}
        targetDate={ym("2027-08")}
        hasGoal
      />
    )

    expect(screen.getByText("August 2027")).toBeInTheDocument()
  })

  it("says plainly when the goal is not reachable rather than showing nothing", () => {
    render(
      <CapitalHeadline total={Money.zero} netWorth={undefined} targetDate={undefined} hasGoal />
    )

    expect(screen.getByText(/not reachable on this trajectory/i)).toBeInTheDocument()
  })

  it("hides net worth entirely where nothing is owed (CAP-11)", () => {
    render(
      <CapitalHeadline
        total={euros(35_000)}
        netWorth={undefined}
        targetDate={ym("2027-08")}
        hasGoal
      />
    )

    expect(screen.queryByText(/net worth/i)).not.toBeInTheDocument()
  })

  it("shows net worth beneath the headline where debts exist", () => {
    render(
      <CapitalHeadline
        total={euros(15_000)}
        netWorth={euros(5_500)}
        targetDate={ym("2027-08")}
        hasGoal
      />
    )

    expect(screen.getByText("€15,000")).toBeInTheDocument()
    expect(screen.getByText("€5,500")).toBeInTheDocument()
    expect(screen.getByText(/less what is still owed/i)).toBeInTheDocument()
  })
})

describe("a holding row", () => {
  it("marks an asset's value as an estimate, never as a balance (spec §70)", () => {
    render(group({ summaries: [summary({ value: "~€11,000", estimated: true })] }))

    expect(screen.getByText("~€11,000")).toBeInTheDocument()
    expect(screen.getByText(/estimated/i)).toBeInTheDocument()
  })

  it("strikes an excluded holding's value and says it is still here (spec §72)", () => {
    render(group({ summaries: [summary({ included: false, counted: false })] }))

    expect(screen.getByText("€24,000")).toHaveClass("line-through")
    expect(screen.getByText(/still here, and still worth what it is worth/i)).toBeInTheDocument()
  })

  it("marks a valuation older than a year as stale (CAP-06)", () => {
    render(group({ summaries: [summary({ stale: true })] }))

    expect(screen.getByText(/valued over a year ago/i)).toBeInTheDocument()
  })

  it("says when nothing has been recorded rather than showing zero", () => {
    render(group({ summaries: [summary({ value: "No value recorded", asOf: undefined })] }))

    expect(screen.getByText("No value recorded")).toBeInTheDocument()
  })

  it("reports an inclusion toggle rather than removing the row", async () => {
    const onToggleIncluded = vi.fn<(id: HoldingId, included: boolean) => void>()
    render(group({ onToggleIncluded }))

    await userEvent.click(screen.getByRole("switch", { name: /joint current account counted/i }))

    expect(onToggleIncluded).toHaveBeenCalledWith("a1", false)
  })
})

describe("a holding's detail", () => {
  const panel = (props: Partial<Parameters<typeof HoldingDetailPanel>[0]> = {}) => (
    <HoldingDetailPanel
      summary={summary()}
      history={[]}
      onRecord={() => {}}
      onRemoveValuation={() => {}}
      onDelete={() => {}}
      busy={false}
      error={undefined}
      {...props}
    />
  )

  it("shows the current value beside the field, so it is corrected rather than recalled", () => {
    render(panel())

    expect(screen.getByText(/currently €24,000/i)).toBeInTheDocument()
  })

  it("reports a recorded value with its date", async () => {
    const onRecord = vi.fn<(date: string, amount: string) => void>()
    render(panel({ onRecord }))

    await userEvent.type(screen.getByLabelText(/as of/i), "2026-09-30")
    await userEvent.type(screen.getByLabelText(/value \(€\)/i), "26000")
    await userEvent.click(screen.getByRole("button", { name: /^record$/i }))

    expect(onRecord).toHaveBeenCalledWith("2026-09-30", "26000")
  })

  it("says a future date is refused, and why", () => {
    render(panel({ error: "That date has not happened yet. Record what is there today." }))

    expect(screen.getByText(/has not happened yet/i)).toBeInTheDocument()
  })
})

describe("deleting a holding", () => {
  it("names the valuation history that goes with it (CAP-09)", () => {
    render(
      <DeleteHoldingDialog
        name="Dive watch"
        valuations={3}
        busy={false}
        error={undefined}
        onConfirm={() => {}}
        onExcludeInstead={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.getByText(/3 recorded values will be deleted/i)).toBeInTheDocument()
  })

  it("offers leaving it out of capital as the reversible alternative", async () => {
    const onExcludeInstead = vi.fn<() => void>()
    render(
      <DeleteHoldingDialog
        name="Dive watch"
        valuations={1}
        busy={false}
        error={undefined}
        onConfirm={() => {}}
        onExcludeInstead={onExcludeInstead}
        onCancel={() => {}}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: /leave out of capital instead/i }))

    expect(onExcludeInstead).toHaveBeenCalledOnce()
  })
})
