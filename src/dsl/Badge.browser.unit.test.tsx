import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Badge, basisBadge, shiftBadge } from "@/dsl/Badge"

describe("certainty and basis", () => {
  it("distinguishes actual from forecast", () => {
    render(<Badge kind="actual" />)
    expect(screen.getByText("Actual")).toBeInTheDocument()
  })

  it("marks an estimated valuation, per spec §70", () => {
    render(<Badge kind={basisBadge("estimated")} />)
    expect(screen.getByText("Estimated")).toBeInTheDocument()
  })

  it("marks a recorded one as confirmed", () => {
    render(<Badge kind={basisBadge("actual")} />)
    expect(screen.getByText("Confirmed")).toBeInTheDocument()
  })
})

describe("a moved target date", () => {
  it("reads as a direction, with the count in front", () => {
    render(<Badge kind={shiftBadge(-3)}>3 months</Badge>)
    expect(screen.getByText(/3 months sooner/)).toBeInTheDocument()
  })

  it("says later when it slips", () => {
    render(<Badge kind={shiftBadge(2)}>2 months</Badge>)
    expect(screen.getByText(/2 months later/)).toBeInTheDocument()
  })

  it("says so plainly when nothing moved", () => {
    render(<Badge kind={shiftBadge(0)} />)
    expect(screen.getByText("no change")).toBeInTheDocument()
  })

  it("hides the arrow from screen readers, since the word already says it", () => {
    const { container } = render(<Badge kind="sooner" />)
    expect(container.querySelector("[aria-hidden='true']")?.textContent).toBe("↓")
  })
})
