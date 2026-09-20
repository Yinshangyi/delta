import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Result } from "effect"
import { describe, expect, it, vi } from "vitest"

import {
  Household,
  householdId,
  name,
  Person,
  personId
} from "@/modules/household/core/domain/Household"
import { MembersPanel } from "@/modules/household/primary_adapters/react/components/MembersPanel"
import { RemovePersonDialog } from "@/modules/household/primary_adapters/react/components/RemovePersonDialog"

import type { HouseholdOverview } from "@/modules/household/core/use_cases/HouseholdOverviewQuery"

const named = (value: string) => Result.getOrThrow(name(value))

const overview = (): HouseholdOverview => {
  const id = householdId("h1")
  const ada = new Person({ id: personId("p1"), householdId: id, name: named("Ada") })
  const lin = new Person({ id: personId("p2"), householdId: id, name: named("Lin") })
  return {
    household: new Household({ id, name: named("Flat 3"), members: [ada, lin] }),
    members: [
      { person: ada, sources: [] },
      { person: lin, sources: [] }
    ]
  }
}

const panel = (props: Partial<Parameters<typeof MembersPanel>[0]> = {}) => (
  <MembersPanel
    overview={overview()}
    onRename={() => {}}
    onAddPerson={() => {}}
    onRemovePerson={() => {}}
    onToggleSource={() => {}}
    addIncomeFor={() => null}
    busy={false}
    renameError={undefined}
    addPersonError={undefined}
    {...props}
  />
)

describe("household and members", () => {
  it("shows every member, however many there are", () => {
    render(panel())

    expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Lin" })).toBeInTheDocument()
  })

  it("says plainly that a member has no income rather than showing nothing", () => {
    render(panel())

    expect(screen.getAllByText(/no income recorded/i)).toHaveLength(2)
  })

  it("adds a person from a name alone", async () => {
    const onAddPerson = vi.fn<(person: string) => void>()
    render(panel({ onAddPerson }))

    await userEvent.type(screen.getByLabelText(/add someone/i), "Sam")
    await userEvent.click(screen.getByRole("button", { name: /add person/i }))

    expect(onAddPerson).toHaveBeenCalledWith("Sam")
  })

  it("keeps the household name editable after first run", async () => {
    const onRename = vi.fn<(to: string) => void>()
    render(panel({ onRename }))

    const field = screen.getByLabelText(/household name/i)
    await userEvent.clear(field)
    await userEvent.type(field, "Ada and Lin")
    await userEvent.click(screen.getByRole("button", { name: /^rename$/i }))

    expect(onRename).toHaveBeenCalledWith("Ada and Lin")
  })

  it("asks before removing, and says what goes with them", () => {
    render(
      <RemovePersonDialog
        person="Lin"
        error={undefined}
        busy={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.getByText(/income sources are removed too/i)).toBeInTheDocument()
    expect(screen.getByText(/reach the goal later/i)).toBeInTheDocument()
  })

  it("gives a reason when the removal is refused, in place of doing nothing", () => {
    render(
      <RemovePersonDialog
        person="Ada"
        error="A household needs at least one person. Add someone else first."
        busy={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.getByText(/needs at least one person/i)).toBeInTheDocument()
  })
})
