import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "@/App"

describe("App", () => {
  it("names the question the product exists to answer", () => {
    render(<App />)
    expect(screen.getByRole("heading", { name: /when do we reach the goal/i })).toBeInTheDocument()
  })
})
