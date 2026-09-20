import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "@/App"

/**
 * The shell is behind the household gate now, so this is no longer a test that
 * the nav renders — `AppShell.browser.unit.test.tsx` owns that. What it pins is
 * that nothing of the app is reachable before there is a household to show it
 * for (spec §65).
 */
describe("App", () => {
  it("shows setup, not the shell, before a household exists", async () => {
    render(<App />)

    expect(screen.queryByRole("navigation", { name: /sections/i })).not.toBeInTheDocument()
    expect(
      await screen.findByRole("heading", { name: /set up your household/i }, { timeout: 5000 })
    ).toBeInTheDocument()
  })
})
