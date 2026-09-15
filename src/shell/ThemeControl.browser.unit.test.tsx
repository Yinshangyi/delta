import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ThemeControl } from "@/shell/ThemeControl"

import type { ThemePreference } from "@/shell/theme/Theme"

describe("the appearance control", () => {
  it("offers system as a real choice, not the absence of one", () => {
    render(<ThemeControl preference="system" onChange={() => {}} />)
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Light" })).not.toBeChecked()
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked()
  })

  it("reports an explicit override", async () => {
    const onChange = vi.fn<(preference: ThemePreference) => void>()
    render(<ThemeControl preference="system" onChange={onChange} />)

    await userEvent.click(screen.getByRole("radio", { name: "Dark" }))

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith("dark")
  })
})
