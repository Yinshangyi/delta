import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "@/dsl/Button"
import { EmptyState } from "@/dsl/EmptyState"
import { FailureState } from "@/dsl/FailureState"

describe("an empty screen", () => {
  it("says what the screen is for and what to do next", () => {
    render(
      <EmptyState
        title="No accounts or assets yet"
        description="Capital is everything that counts toward the goal."
        action={<Button tone="primary">Add account</Button>}
      />
    )
    expect(screen.getByText("No accounts or assets yet")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add account" })).toBeInTheDocument()
  })

  it("holds its space, so adding the first row does not shift the layout", () => {
    const { container } = render(<EmptyState title="t" description="d" />)
    expect(container.firstElementChild?.className).toContain("min-h-56")
  })
})

describe("a failed read", () => {
  it("is announced, because it arrives after the page has settled", () => {
    render(<FailureState title="Could not open the database" detail="Try reloading." />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("explains in plain language and offers a way out", () => {
    render(
      <FailureState
        title="Could not open the database"
        detail="Your data is still on this device."
        retry={<Button tone="primary">Try again</Button>}
      />
    )
    expect(screen.getByText("Your data is still on this device.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  it("occupies the same space as a working screen", () => {
    const { container } = render(<FailureState title="t" detail="d" />)
    expect(container.firstElementChild?.className).toContain("min-h-56")
  })
})
