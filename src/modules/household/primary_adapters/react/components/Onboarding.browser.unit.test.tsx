import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { OnboardingScreen } from "@/modules/household/primary_adapters/react/components/OnboardingScreen"

describe("first run", () => {
  it("asks for a household and one person, and nothing else", () => {
    render(<OnboardingScreen onSubmit={() => {}} busy={false} error={undefined} />)

    expect(screen.getByLabelText(/household name/i)).toHaveValue("")
    expect(screen.getByLabelText(/first person/i)).toHaveValue("")
    expect(screen.getByRole("button", { name: /create household/i })).toBeDisabled()
  })

  it("passes both names through untouched", async () => {
    const onSubmit = vi.fn<(household: string, firstPerson: string) => void>()
    render(<OnboardingScreen onSubmit={onSubmit} busy={false} error={undefined} />)

    await userEvent.type(screen.getByLabelText(/household name/i), "Flat 3")
    await userEvent.type(screen.getByLabelText(/first person/i), "Ada")
    await userEvent.click(screen.getByRole("button", { name: /create household/i }))

    expect(onSubmit).toHaveBeenCalledWith("Flat 3", "Ada")
  })

  it("shows a refused name against the field that was refused", () => {
    render(<OnboardingScreen onSubmit={() => {}} busy={false} error="A name is needed." />)

    expect(screen.getByLabelText(/first person/i)).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("A name is needed.")).toBeInTheDocument()
  })
})
