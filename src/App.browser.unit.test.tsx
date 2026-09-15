import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "@/App"

describe("App", () => {
  it("mounts the shell, so every section is one click away", () => {
    render(<App />)
    expect(screen.getByRole("navigation", { name: /sections/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
  })
})
