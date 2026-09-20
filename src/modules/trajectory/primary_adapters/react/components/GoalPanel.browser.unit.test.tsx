import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GoalPanel } from "@/modules/trajectory/primary_adapters/react/components/GoalPanel"

const panel = (props: Partial<Parameters<typeof GoalPanel>[0]> = {}) => (
  <GoalPanel
    name="Runway"
    targetEuros="150000"
    enabled={true}
    onSave={() => {}}
    onToggle={() => {}}
    busy={false}
    error={undefined}
    {...props}
  />
)

describe("the goal", () => {
  it("shows what was entered, with nothing suggested", () => {
    render(panel({ name: "", targetEuros: "", enabled: undefined }))

    expect(screen.getByLabelText(/goal name/i)).toHaveValue("")
    expect(screen.getByLabelText(/target amount/i)).toHaveValue(null)
  })

  it("offers no switch before there is a goal to switch", () => {
    render(panel({ enabled: undefined }))

    expect(screen.queryByRole("switch")).not.toBeInTheDocument()
  })

  it("hands both fields over as typed", async () => {
    const onSave = vi.fn<(name: string, target: string) => void>()
    render(panel({ name: "", targetEuros: "", enabled: undefined, onSave }))

    await userEvent.type(screen.getByLabelText(/goal name/i), "A year of runway")
    await userEvent.type(screen.getByLabelText(/target amount/i), "150000")
    await userEvent.click(screen.getByRole("button", { name: /save goal/i }))

    expect(onSave).toHaveBeenCalledWith("A year of runway", "150000")
  })

  it("says a switched-off goal is kept rather than gone", () => {
    render(panel({ enabled: false }))

    expect(screen.getByRole("switch")).not.toBeChecked()
    expect(screen.getByText(/kept, but nothing is being projected/i)).toBeInTheDocument()
  })

  it("puts a refused target against the field that was refused", () => {
    render(panel({ error: "A target has to be more than nothing." }))

    expect(screen.getByLabelText(/target amount/i)).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText(/more than nothing/i)).toBeInTheDocument()
  })
})
