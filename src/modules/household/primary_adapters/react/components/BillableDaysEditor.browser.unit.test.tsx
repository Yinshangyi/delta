import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { BillableDaysEditor } from "@/modules/household/primary_adapters/react/components/BillableDaysEditor"

const editor = (props: Partial<Parameters<typeof BillableDaysEditor>[0]> = {}) => (
  <BillableDaysEditor
    standard={18}
    overrides={new Map([["2026-08", 12]])}
    onSet={() => {}}
    onClear={() => {}}
    busy={false}
    {...props}
  />
)

describe("billable days", () => {
  it("marks an overridden month in words, not by colour alone", () => {
    render(editor())

    expect(screen.getByText(/August 2026 — 12 days/)).toBeInTheDocument()
    expect(screen.getByText("overridden")).toBeInTheDocument()
  })

  it("names the default so the exception is readable against it", () => {
    render(editor())

    expect(screen.getByText(/default is 18/i)).toBeInTheDocument()
  })

  it("clears a month back to following the default", async () => {
    const onClear = vi.fn<(month: string) => void>()
    render(editor({ onClear }))

    await userEvent.click(screen.getByRole("button", { name: /clear/i }))

    expect(onClear).toHaveBeenCalledWith("2026-08")
  })

  it("accepts zero as an override, because an unbilled month is a real one", async () => {
    const onSet = vi.fn<(month: string, days: number) => void>()
    render(editor({ overrides: new Map(), onSet }))

    await userEvent.type(screen.getByLabelText(/^month$/i), "2026-12")
    await userEvent.type(screen.getByLabelText(/^days$/i), "0")
    await userEvent.click(screen.getByRole("button", { name: /override/i }))

    expect(onSet).toHaveBeenCalledWith("2026-12", 0)
  })
})
