import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { AppShell } from "@/shell/AppShell"

const renderShell = (current: Parameters<typeof AppShell>[0]["current"] = "dashboard") =>
  render(
    <AppShell current={current} aside={<button type="button">Appearance</button>}>
      <h1>Panel</h1>
    </AppShell>
  )

describe("the sidebar", () => {
  it("offers the six sections and nothing else", () => {
    renderShell()
    const nav = screen.getByRole("navigation", { name: /sections/i })
    const names = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent)

    expect(names).toStrictEqual([
      "Dashboard",
      "Projection",
      "Capital",
      "Commitments",
      "Scenarios",
      "Settings"
    ])
  })

  it("marks the current section programmatically, not only visually", () => {
    renderShell("capital")
    expect(screen.getByRole("link", { name: "Capital" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current")
  })

  it("links each section to a hash a reload can restore", () => {
    renderShell()
    expect(screen.getByRole("link", { name: "Scenarios" })).toHaveAttribute("href", "#/scenarios")
  })

  it("renders its children and its aside", () => {
    renderShell()
    expect(screen.getByRole("heading", { name: "Panel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Appearance" })).toBeInTheDocument()
  })
})

describe("keyboard navigation", () => {
  it("reaches the sections in order by tabbing, with a focus state", async () => {
    renderShell()
    await userEvent.tab()
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole("link", { name: "Projection" })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole("link", { name: "Capital" })).toHaveFocus()
  })
})
