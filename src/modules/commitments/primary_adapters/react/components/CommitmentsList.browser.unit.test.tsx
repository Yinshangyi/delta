import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CommitmentsList } from "@/modules/commitments/primary_adapters/react/components/CommitmentsList"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { CommitmentSummary } from "@/modules/commitments/primary_adapters/react/CommitmentSummary"

const summary = (overrides: Partial<CommitmentSummary> = {}): CommitmentSummary => ({
  id: "r1" as CommitmentId,
  kind: "RecurringExpense",
  kindLabel: "Recurring",
  name: "Rent",
  headline: "€1,280.00 a month",
  detail: undefined,
  estimated: false,
  enabled: true,
  ...overrides
})

const list = (props: Partial<Parameters<typeof CommitmentsList>[0]> = {}) => (
  <CommitmentsList
    summaries={[summary()]}
    selected={undefined}
    onSelect={() => {}}
    onToggle={() => {}}
    onAdd={() => {}}
    busy={false}
    {...props}
  />
)

describe("the commitments list", () => {
  it("mixes every kind in one flat list, with no section per type (spec §28)", () => {
    render(
      list({
        summaries: [
          summary(),
          summary({ id: "d1" as CommitmentId, kind: "Debt", kindLabel: "Debt", name: "Card debt" }),
          summary({
            id: "t1" as CommitmentId,
            kind: "TaxLiability",
            kindLabel: "Tax",
            name: "2025 income tax"
          })
        ]
      })
    )

    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    expect(screen.queryByRole("heading", { name: /taxes/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /debt/i })).not.toBeInTheDocument()
  })

  it("draws a mark per kind rather than lettering one from the name", () => {
    const { container } = render(
      list({
        summaries: [
          summary(),
          summary({ id: "d1" as CommitmentId, kind: "Debt", kindLabel: "Debt", name: "Card debt" })
        ]
      })
    )

    const marks = container.querySelectorAll("svg path")
    expect(marks).toHaveLength(2)
    expect(marks[0]?.getAttribute("d")).not.toBe(marks[1]?.getAttribute("d"))
  })

  it("names the kind in words as well, so the mark is never the only signal", () => {
    render(list())

    expect(screen.getByText("Recurring")).toBeInTheDocument()
  })

  it("strikes through a disabled row, so the list reads without the switches", () => {
    render(list({ summaries: [summary({ enabled: false })] }))

    expect(screen.getByText("Rent")).toHaveClass("line-through")
    expect(screen.getByText("Off")).toBeInTheDocument()
  })

  it("marks an estimated liability by more than colour (spec §26)", () => {
    render(
      list({
        summaries: [
          summary({
            kind: "TaxLiability",
            kindLabel: "Tax",
            name: "2026 catch-up",
            estimated: true,
            headline: "~€14,000.00 scheduled"
          })
        ]
      })
    )

    expect(screen.getByText(/estimated/i)).toBeInTheDocument()
    expect(screen.getByText(/~€14,000\.00 scheduled/)).toBeInTheDocument()
  })

  it("reports a toggle rather than removing the row", async () => {
    const onToggle = vi.fn<(id: CommitmentId, enabled: boolean) => void>()
    render(list({ onToggle }))

    await userEvent.click(screen.getByRole("switch", { name: /rent on/i }))

    expect(onToggle).toHaveBeenCalledWith("r1", false)
  })

  it("selects a row when its body is clicked", async () => {
    const onSelect = vi.fn<(id: CommitmentId) => void>()
    render(list({ onSelect }))

    await userEvent.click(screen.getByRole("button", { name: /rent/i }))

    expect(onSelect).toHaveBeenCalledWith("r1")
  })

  it("says what commitments are for when there are none", () => {
    render(list({ summaries: [] }))

    expect(screen.getByText(/nothing committed yet/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add commitment/i })).toBeInTheDocument()
  })
})
