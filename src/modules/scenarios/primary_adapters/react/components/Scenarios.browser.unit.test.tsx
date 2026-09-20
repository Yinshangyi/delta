import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Result } from "effect"
import { describe, expect, it, vi } from "vitest"

import { BrokenReference } from "@/modules/scenarios/core/domain/BrokenReferences"
import { overrideId } from "@/modules/scenarios/core/domain/Scenario"
import { ChangeCost, TimeCost } from "@/modules/scenarios/core/domain/TimeCost"
import { ApplyScenarioDialog } from "@/modules/scenarios/primary_adapters/react/components/ApplyScenarioDialog"
import { BrokenScenarioNotice } from "@/modules/scenarios/primary_adapters/react/components/BrokenScenarioNotice"
import { ChangeStack } from "@/modules/scenarios/primary_adapters/react/components/ChangeStack"
import { ComparisonPanel } from "@/modules/scenarios/primary_adapters/react/components/ComparisonPanel"
import { PreviewBanner } from "@/modules/scenarios/primary_adapters/react/components/PreviewBanner"
import { ScenarioList } from "@/modules/scenarios/primary_adapters/react/components/ScenarioList"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { ScenarioId } from "@/modules/scenarios/core/domain/Scenario"
import type { ChangeSummary } from "@/modules/scenarios/primary_adapters/react/ChangeSummary"

const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))

const changes = (): ReadonlyArray<ChangeSummary> => [
  { id: overrideId("o1"), label: "Add a purchase", detail: "Holiday, €6,000 on 15 Mar 2026" },
  { id: overrideId("o2"), label: "Change a salary", detail: "Employment at €4,000 a month" }
]

describe("the change stack", () => {
  it("says what there is nothing in it yet", () => {
    render(<ChangeStack changes={[]} brokenIds={[]} onRemove={() => {}} busy={false} />)

    expect(screen.getByText(/no changes yet/i)).toBeInTheDocument()
  })

  it("names each change as a decision rather than a row", () => {
    render(<ChangeStack changes={changes()} brokenIds={[]} onRemove={() => {}} busy={false} />)

    expect(screen.getByText("Holiday, €6,000 on 15 Mar 2026")).toBeInTheDocument()
    expect(screen.getByText("Employment at €4,000 a month")).toBeInTheDocument()
  })

  it("removes one change without the others (SCN-06)", async () => {
    const onRemove = vi.fn<(id: string) => void>()
    render(<ChangeStack changes={changes()} brokenIds={[]} onRemove={onRemove} busy={false} />)

    await userEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]!)

    expect(onRemove).toHaveBeenCalledWith("o1")
  })

  it("marks a broken change in the stack itself", () => {
    render(
      <ChangeStack
        changes={changes()}
        brokenIds={[overrideId("o1")]}
        onRemove={() => {}}
        busy={false}
      />
    )

    expect(screen.getByText("Holiday, €6,000 on 15 Mar 2026")).toHaveClass("line-through")
  })
})

describe("the comparison", () => {
  const cost = (months: number | undefined, perChange: ReadonlyArray<ChangeCost> = []) =>
    new TimeCost({
      baseline: ym("2028-10"),
      simulated: months === undefined ? undefined : ym("2028-07"),
      months,
      perChange
    })

  it("shows current beside simulation (spec §34)", () => {
    render(<ComparisonPanel cost={cost(-3)} changes={changes()} />)

    expect(screen.getByText("October 2028")).toBeInTheDocument()
    expect(screen.getByText("July 2028")).toBeInTheDocument()
  })

  it("marks the simulation hypothetical in words and without colour", () => {
    render(<ComparisonPanel cost={cost(-3)} changes={changes()} />)

    expect(screen.getAllByText(/hypothetical/i).length).toBeGreaterThan(0)
  })

  it("states the impact with direction and magnitude (spec §36)", () => {
    render(<ComparisonPanel cost={cost(-3)} changes={changes()} />)

    expect(screen.getByText("3 months sooner")).toBeInTheDocument()
  })

  it("decomposes a stack, per change (SCN-05)", () => {
    render(
      <ComparisonPanel
        cost={cost(-3, [
          new ChangeCost({ override: overrideId("o1"), months: 3 }),
          new ChangeCost({ override: overrideId("o2"), months: -6 })
        ])}
        changes={changes()}
      />
    )

    expect(screen.getByText(/where that comes from/i)).toBeInTheDocument()
    expect(screen.getByText("3 months later")).toBeInTheDocument()
    expect(screen.getByText("6 months sooner")).toBeInTheDocument()
  })

  it("says there is no comparison rather than inventing one (SCN-05)", () => {
    render(<ComparisonPanel cost={cost(undefined)} changes={changes()} />)

    expect(screen.getByText(/no comparison/i)).toBeInTheDocument()
    expect(screen.queryByText(/0 months/)).not.toBeInTheDocument()
  })
})

describe("a broken scenario", () => {
  it("names what it points at and refuses to guess (SCN-10)", () => {
    render(
      <BrokenScenarioNotice
        broken={[
          new BrokenReference({
            override: overrideId("o1"),
            kind: "ExcludeHolding",
            missing: "holding",
            reference: "gone"
          })
        ]}
      />
    )

    expect(screen.getByText(/points at something that no longer exists/i)).toBeInTheDocument()
    expect(screen.getByText(/holding/)).toBeInTheDocument()
    expect(screen.getByText(/will not guess what you meant/i)).toBeInTheDocument()
  })

  it("is absent when nothing is broken", () => {
    const { container } = render(<BrokenScenarioNotice broken={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe("the scenario list", () => {
  const rows = (broken = false) => [
    {
      id: "sc1" as ScenarioId,
      name: "What if the rate rose",
      changes: ["Consulting at €700 a day"],
      targetDate: ym("2028-07"),
      months: -3,
      broken
    }
  ]

  it("states the current baseline for comparison (SCN-07)", () => {
    render(
      <ScenarioList
        rows={rows()}
        baseline={ym("2028-10")}
        onOpen={() => {}}
        onDelete={() => {}}
        onNew={() => {}}
        busy={false}
      />
    )

    expect(screen.getByText(/as things are, you reach the goal in/i)).toBeInTheDocument()
    expect(screen.getByText("October 2028")).toBeInTheDocument()
  })

  it("distinguishes sooner by a glyph and a word, not colour (SCN-07)", () => {
    render(
      <ScenarioList
        rows={rows()}
        baseline={ym("2028-10")}
        onOpen={() => {}}
        onDelete={() => {}}
        onNew={() => {}}
        busy={false}
      />
    )

    expect(screen.getByText("3 months sooner")).toBeInTheDocument()
    expect(screen.getByText("↓")).toBeInTheDocument()
  })

  it("shows no delta for a broken scenario (SCN-10)", () => {
    render(
      <ScenarioList
        rows={rows(true)}
        baseline={ym("2028-10")}
        onOpen={() => {}}
        onDelete={() => {}}
        onNew={() => {}}
        busy={false}
      />
    )

    expect(screen.getByText(/needs attention/i)).toBeInTheDocument()
    expect(screen.queryByText("3 months sooner")).not.toBeInTheDocument()
  })

  it("carries no edit-date metadata (SCN-07)", () => {
    render(
      <ScenarioList
        rows={rows()}
        baseline={ym("2028-10")}
        onOpen={() => {}}
        onDelete={() => {}}
        onNew={() => {}}
        busy={false}
      />
    )

    expect(screen.queryByText(/edited|updated|modified/i)).not.toBeInTheDocument()
  })

  it("explains what scenarios are for when there are none", () => {
    render(
      <ScenarioList
        rows={[]}
        baseline={ym("2028-10")}
        onOpen={() => {}}
        onDelete={() => {}}
        onNew={() => {}}
        busy={false}
      />
    )

    expect(screen.getByText(/no scenarios yet/i)).toBeInTheDocument()
    expect(screen.getByText(/delta answers in months/i)).toBeInTheDocument()
  })
})

describe("applying and previewing", () => {
  it("lists exactly what will change before anything does (SCN-08)", () => {
    render(
      <ApplyScenarioDialog
        open
        changes={changes()}
        busy={false}
        error={undefined}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.getByText("Holiday, €6,000 on 15 Mar 2026")).toBeInTheDocument()
    expect(screen.getByText("Employment at €4,000 a month")).toBeInTheDocument()
    expect(screen.getByText(/only step that changes anything/i)).toBeInTheDocument()
  })

  it("keeps the exit from preview always available (SCN-09)", async () => {
    const onExit = vi.fn<() => void>()
    render(<PreviewBanner name="What if the rate rose" onExit={onExit} />)

    expect(screen.getByText(/previewing a scenario/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing you see is your real plan/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /back to the real plan/i }))
    expect(onExit).toHaveBeenCalledOnce()
  })
})
