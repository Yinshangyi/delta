import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Switch } from "@/dsl/Switch"

describe("a switch", () => {
  it("is announced as a switch with its label and state", () => {
    render(<Switch checked label="Include in capital" onChange={() => {}} />)
    const control = screen.getByRole("switch", { name: "Include in capital" })
    expect(control).toBeChecked()
  })

  it("toggles on click", async () => {
    const onChange = vi.fn<(checked: boolean) => void>()
    render(<Switch checked={false} label="Include in capital" onChange={onChange} />)

    await userEvent.click(screen.getByRole("switch", { name: "Include in capital" }))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("toggles on space, because it is a real control", async () => {
    const onChange = vi.fn<(checked: boolean) => void>()
    render(<Switch checked={false} label="Include in capital" onChange={onChange} />)

    await userEvent.tab()
    await userEvent.keyboard(" ")

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("cannot be toggled when disabled", async () => {
    const onChange = vi.fn<(checked: boolean) => void>()
    render(<Switch checked={false} disabled label="Include in capital" onChange={onChange} />)

    await userEvent.click(screen.getByRole("switch", { name: "Include in capital" }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it("keeps its label as the accessible name when it is hidden visually", () => {
    render(<Switch checked onChange={() => {}} label="Dive watch counted" labelHidden />)

    // The row beside it already shows the name, so repeating it visibly
    // squeezed the figures — but a switch with no name at all is unusable
    // with a screen reader.
    expect(screen.getByRole("switch", { name: "Dive watch counted" })).toBeInTheDocument()
    expect(screen.queryByText("Dive watch counted")).toHaveClass("sr-only")
  })
})
