import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AddIncomeForm } from "@/modules/household/primary_adapters/react/components/AddIncomeForm"

import type { IncomeDraft } from "@/modules/household/primary_adapters/react/components/IncomeDraftState"

const fillFreelance = async () => {
  await userEvent.click(screen.getByRole("button", { name: /add income/i }))
  await userEvent.type(screen.getByLabelText(/^name$/i), "Consulting")
  await userEvent.type(screen.getByLabelText(/start date/i), "2026-01-01")
  await userEvent.type(screen.getByLabelText(/daily rate/i), "600")
  await userEvent.type(screen.getByLabelText(/payout ratio/i), "80")
  await userEvent.type(screen.getByLabelText(/billable days a month/i), "18")
}

describe("adding income", () => {
  it("offers both kinds, and neither is the other's default", async () => {
    render(<AddIncomeForm onSubmit={async () => true} busy={false} error={undefined} />)
    await userEvent.click(screen.getByRole("button", { name: /add income/i }))

    expect(screen.getByRole("combobox", { name: /kind/i })).toHaveValue("freelance")
    expect(screen.getByRole("option", { name: "Salary" })).toBeInTheDocument()
  })

  it("asks a salary for tax, not for a rate", async () => {
    render(<AddIncomeForm onSubmit={async () => true} busy={false} error={undefined} />)
    await userEvent.click(screen.getByRole("button", { name: /add income/i }))
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /kind/i }), "salary")

    expect(screen.getByLabelText(/monthly income tax/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/daily rate/i)).not.toBeInTheDocument()
  })

  it("says annual gross enters no calculation, because it does not (spec §12)", async () => {
    render(<AddIncomeForm onSubmit={async () => true} busy={false} error={undefined} />)
    await userEvent.click(screen.getByRole("button", { name: /add income/i }))
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /kind/i }), "salary")

    expect(screen.getByText(/enters no calculation/i)).toBeInTheDocument()
  })

  it("hands over every field as typed, converting nothing itself", async () => {
    const onSubmit = vi.fn<(draft: IncomeDraft) => Promise<boolean>>(async () => true)
    render(<AddIncomeForm onSubmit={onSubmit} busy={false} error={undefined} />)

    await fillFreelance()
    await userEvent.click(screen.getByRole("button", { name: /save income/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      kind: "freelance",
      name: "Consulting",
      dailyRateEuros: "600",
      estimatedPayoutPercent: "80",
      standardBillableDays: "18"
    })
  })

  it("closes only once the save succeeded", async () => {
    render(<AddIncomeForm onSubmit={async () => true} busy={false} error={undefined} />)

    await fillFreelance()
    await userEvent.click(screen.getByRole("button", { name: /save income/i }))

    expect(screen.queryByLabelText(/daily rate/i)).not.toBeInTheDocument()
  })

  it("keeps a refused draft on screen rather than making it be retyped", async () => {
    render(<AddIncomeForm onSubmit={async () => false} busy={false} error="A rate is needed." />)

    await fillFreelance()
    await userEvent.click(screen.getByRole("button", { name: /save income/i }))

    expect(screen.getByLabelText(/daily rate/i)).toHaveValue(600)
    expect(screen.getByText("A rate is needed.")).toBeInTheDocument()
  })
})
