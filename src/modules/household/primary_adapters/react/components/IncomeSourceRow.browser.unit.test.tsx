import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { IncomeSourceRow } from "@/modules/household/primary_adapters/react/components/IncomeSourceRow"

import type { IncomeSummary } from "@/modules/household/primary_adapters/react/IncomeSummary"

const summary = (overrides: Partial<IncomeSummary> = {}): IncomeSummary => ({
  kind: "Freelance",
  name: "Consulting",
  headline: "€600.00 per day",
  details: ["80% payout ratio"],
  estimate: true,
  period: "01 Jan 2026 — ongoing",
  enabled: true,
  ...overrides
})

describe("an income source on screen", () => {
  it("labels a freelance figure an estimate, in words (spec §10)", () => {
    render(<IncomeSourceRow summary={summary()} onToggle={() => {}} busy={false} />)

    expect(screen.getByText(/estimated/i)).toBeInTheDocument()
    expect(screen.getByText(/not a guaranteed transfer/i)).toBeInTheDocument()
  })

  it("does not call a salary an estimate", () => {
    render(
      <IncomeSourceRow
        summary={summary({ kind: "Salary", estimate: false })}
        onToggle={() => {}}
        busy={false}
      />
    )

    expect(screen.queryByText(/estimated/i)).not.toBeInTheDocument()
  })

  it("keeps a disabled source visible and says why it earns nothing", () => {
    render(
      <IncomeSourceRow summary={summary({ enabled: false })} onToggle={() => {}} busy={false} />
    )

    expect(screen.getByText("Consulting")).toBeInTheDocument()
    expect(screen.getByText(/produces no income while it is off/i)).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: /consulting on/i })).not.toBeChecked()
  })

  it("reports a toggle rather than removing the source", async () => {
    const onToggle = vi.fn<(enabled: boolean) => void>()
    render(<IncomeSourceRow summary={summary()} onToggle={onToggle} busy={false} />)

    await userEvent.click(screen.getByRole("switch", { name: /consulting on/i }))

    expect(onToggle).toHaveBeenCalledWith(false)
  })
})
