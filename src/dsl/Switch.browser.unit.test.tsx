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
})
