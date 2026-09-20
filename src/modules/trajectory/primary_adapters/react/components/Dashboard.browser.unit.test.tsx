import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Result } from "effect"
import { describe, expect, it, vi } from "vitest"

import { BankAccount, holdingId } from "@/modules/capital/core/domain/Holding"
import { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"
import { Valuation } from "@/modules/capital/core/domain/Valuation"
import { householdId } from "@/modules/household/core/domain/Household"
import { outlookOver } from "@/modules/trajectory/core/domain/MonthlyOutlook"
import { compare } from "@/modules/trajectory/core/domain/PlanVariance"
import { project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import { curveOf } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import { ProjectionChart } from "@/modules/trajectory/primary_adapters/react/components/ProjectionChart"
import { ProjectionTable } from "@/modules/trajectory/primary_adapters/react/components/ProjectionTable"
import { TargetDatePanel } from "@/modules/trajectory/primary_adapters/react/components/TargetDatePanel"
import { TrajectoryPanel } from "@/modules/trajectory/primary_adapters/react/components/TrajectoryPanel"
import { UpdateBalancesForm } from "@/modules/trajectory/primary_adapters/react/components/UpdateBalancesForm"
import { VariancePanel } from "@/modules/trajectory/primary_adapters/react/components/VariancePanel"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))

const monthly = (from: string, count: number, amount: number, kind = "salary") =>
  Array.from({ length: count }, (_, index) =>
    CashFlow.make({
      date: LocalDate.lastDayOf(YearMonth.addMonths(ym(from), index)),
      amount: euros(amount),
      sourceId: kind,
      sourceKind: kind
    })
  )

const steady = () =>
  project({
    cashFlows: [...monthly("2026-01", 12, 3_000), ...monthly("2026-01", 12, -1_200, "rent")],
    startingCapital: Money.zero,
    target: euros(9_000),
    from: ym("2026-01")
  })

describe("the target date panel", () => {
  it("leads with the date and labels it an estimate (spec §37)", () => {
    render(
      <TargetDatePanel
        targetDate={ym("2028-10")}
        capital={euros(24_000)}
        goal={euros(150_000)}
        netWorth={undefined}
        shortfall={undefined}
      />
    )

    expect(screen.getByText("October 2028")).toBeInTheDocument()
    expect(screen.getByText(/an estimate, on today's figures/i)).toBeInTheDocument()
  })

  it("shows how much of the goal is reached", () => {
    render(
      <TargetDatePanel
        targetDate={ym("2028-10")}
        capital={euros(30_000)}
        goal={euros(150_000)}
        netWorth={undefined}
        shortfall={undefined}
      />
    )

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20")
    expect(screen.getByText(/20% of the goal reached/i)).toBeInTheDocument()
  })

  it("hides net worth where nothing is owed (spec §77)", () => {
    render(
      <TargetDatePanel
        targetDate={ym("2028-10")}
        capital={euros(30_000)}
        goal={euros(150_000)}
        netWorth={undefined}
        shortfall={undefined}
      />
    )

    expect(screen.queryByText(/net worth/i)).not.toBeInTheDocument()
  })

  it("answers rather than erroring when the goal cannot be reached (TRJ-09)", () => {
    render(
      <TargetDatePanel
        targetDate={undefined}
        capital={euros(1_000)}
        goal={euros(150_000)}
        netWorth={undefined}
        shortfall={{ monthly: euros(-400), reason: "so the goal is never reached." }}
      />
    )

    expect(screen.getByText(/not reachable on the current trajectory/i)).toBeInTheDocument()
    expect(screen.getByText(/losing about/i)).toBeInTheDocument()
    expect(screen.getByText("€400")).toBeInTheDocument()
    expect(screen.getByText(/try a scenario/i)).toBeInTheDocument()
  })

  it("tells the fifty-year horizon apart from a losing trajectory (TRJ-09)", () => {
    render(
      <TargetDatePanel
        targetDate={undefined}
        capital={euros(1_000)}
        goal={euros(150_000)}
        netWorth={undefined}
        shortfall={{ monthly: euros(20), reason: "so the goal is not reached within fifty years." }}
      />
    )

    expect(screen.getByText(/within fifty years/i)).toBeInTheDocument()
  })
})

describe("where the money goes", () => {
  it("gives the typical month and says that is what it is (TRJ-06)", () => {
    render(<TrajectoryPanel outlook={outlookOver(steady())} />)

    expect(screen.getByText("€3,000")).toBeInTheDocument()
    expect(screen.getByText("-€1,200")).toBeInTheDocument()
    expect(screen.getByText(/what most months look like/i)).toBeInTheDocument()
  })

  it("states the average including scheduled payments where months differ", () => {
    const lumpy = project({
      cashFlows: [...monthly("2026-01", 12, 2_000), ...monthly("2026-09", 1, -12_000, "tax")],
      startingCapital: Money.zero,
      target: euros(500_000),
      from: ym("2026-01")
    })

    render(<TrajectoryPanel outlook={outlookOver(lumpy, 12)} />)

    expect(screen.getByText(/including scheduled payments such as tax/i)).toBeInTheDocument()
    expect(screen.getByText("€1,000")).toBeInTheDocument()
  })

  it("says plainly when nothing lumpy is coming", () => {
    render(<TrajectoryPanel outlook={outlookOver(steady())} />)

    expect(screen.getByText(/nothing lumpy in the next year/i)).toBeInTheDocument()
  })
})

describe("against plan", () => {
  it("says what there is nothing to compare against, rather than zero (TRJ-10)", () => {
    render(<VariancePanel variance={undefined} />)

    expect(screen.getByText(/nothing to compare against yet/i)).toBeInTheDocument()
    expect(screen.queryByText("€0")).not.toBeInTheDocument()
  })

  it("distinguishes behind by a word and a glyph, not colour alone", () => {
    render(
      <VariancePanel
        variance={compare(euros(29_500), euros(28_000), ym("2028-10"), ym("2028-11"))}
      />
    )

    expect(screen.getByText(/behind the forecast/i)).toBeInTheDocument()
    expect(screen.getByText("€1,500")).toBeInTheDocument()
    expect(screen.getByText(/↑/)).toBeInTheDocument()
  })

  it("states the target date movement in months", () => {
    render(
      <VariancePanel
        variance={compare(euros(29_500), euros(28_000), ym("2028-10"), ym("2028-11"))}
      />
    )

    expect(screen.getByText(/the target date moved 1 month later/i)).toBeInTheDocument()
  })

  it("keeps the tone level — no failure language", () => {
    render(
      <VariancePanel
        variance={compare(euros(29_500), euros(28_000), ym("2028-10"), ym("2028-11"))}
      />
    )

    expect(screen.queryByText(/fail|missed|warning/i)).not.toBeInTheDocument()
  })
})

describe("the projection chart", () => {
  it("draws no area fill beneath the line (TRJ-07)", () => {
    const { container } = render(
      <ProjectionChart curve={curveOf(steady(), ym("2026-03"))} label="Savings" />
    )

    // A filled region under a forecast reads as a quantity accumulated. None
    // of it has been.
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("fill")).toBe("none")
    }
  })

  it("separates recorded from forecast without colour", () => {
    const { container } = render(
      <ProjectionChart curve={curveOf(steady(), ym("2026-03"))} label="Savings" />
    )

    const dashes = [...container.querySelectorAll("path")].map((path) =>
      path.getAttribute("stroke-dasharray")
    )
    expect(dashes).toContain(null)
    expect(dashes.some((value) => value !== null)).toBe(true)
  })

  it("marks where the forecast meets the goal", () => {
    const { container } = render(
      <ProjectionChart curve={curveOf(steady(), ym("2026-03"))} label="Savings" />
    )

    expect(container.querySelector("circle")).toBeInTheDocument()
  })

  it("carries a text label, so the figure is readable without seeing it", () => {
    render(<ProjectionChart curve={curveOf(steady(), ym("2026-03"))} label="Savings" />)

    expect(screen.getByRole("img", { name: "Savings" })).toBeInTheDocument()
  })
})

describe("the month by month table", () => {
  it("shows every column of spec §31", () => {
    render(
      <ProjectionTable months={steady().months} today={ym("2026-03")} goalMonth={ym("2026-05")} />
    )

    for (const heading of ["Month", "Start", "Income", "Commitments", "Net", "End"]) {
      expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument()
    }
  })

  it("tells past from future by a word, not colour (TRJ-08)", () => {
    render(<ProjectionTable months={steady().months} today={ym("2026-03")} goalMonth={undefined} />)

    expect(screen.getAllByText("Actual")).toHaveLength(3)
    expect(screen.getAllByText("Forecast").length).toBeGreaterThan(0)
  })

  it("expands a row into the flows that produced it", async () => {
    render(<ProjectionTable months={steady().months} today={ym("2026-03")} goalMonth={undefined} />)

    await userEvent.click(screen.getByRole("button", { name: /January 2026/ }))

    expect(screen.getByText(/salary/)).toBeInTheDocument()
    expect(screen.getByText(/rent/)).toBeInTheDocument()
  })

  it("does not present a reconstructed past month as recorded fact", async () => {
    render(<ProjectionTable months={steady().months} today={ym("2026-03")} goalMonth={undefined} />)

    await userEvent.click(screen.getByRole("button", { name: /January 2026/ }))

    expect(screen.getByText(/not a record of what happened/i)).toBeInTheDocument()
  })

  it("offers a way to the goal month without paging through every row", () => {
    render(
      <ProjectionTable months={steady().months} today={ym("2026-03")} goalMonth={ym("2026-05")} />
    )

    expect(screen.getByRole("button", { name: /jump to May 2026/i })).toBeInTheDocument()
  })
})

describe("the monthly routine", () => {
  const holding = (id: string, name: string, amount: number) =>
    new ValuedHolding({
      holding: new BankAccount({
        id: holdingId(id),
        householdId: householdId("h1"),
        name,
        institution: undefined,
        includedInCapital: true,
        enabled: true
      }),
      valuation: new Valuation({ amount: euros(amount), asOf: date("2026-08-31"), basis: "actual" })
    })

  const form = (props: Partial<Parameters<typeof UpdateBalancesForm>[0]> = {}) => (
    <UpdateBalancesForm
      holdings={[holding("a1", "Joint account", 24_000), holding("a2", "Emergency fund", 6_000)]}
      today="2026-09-30"
      onSubmit={async () => true}
      onCancel={() => {}}
      busy={false}
      error={undefined}
      {...props}
    />
  )

  it("says in words that blank means unchanged (TRJ-05)", () => {
    render(form())

    expect(
      screen.getByText(/leave a field blank to leave that holding unchanged/i)
    ).toBeInTheDocument()
  })

  it("shows the prior value beside each field, so it is corrected not recalled", () => {
    render(form())

    expect(screen.getByText("Currently €24,000")).toBeInTheDocument()
    expect(screen.getByText("Currently €6,000")).toBeInTheDocument()
  })

  it("updates several holdings in one pass", async () => {
    const onSubmit = vi.fn<
      (date: string, amounts: ReadonlyMap<string, string>) => Promise<boolean>
    >(async () => true)
    render(form({ onSubmit }))

    await userEvent.type(screen.getByLabelText("Joint account"), "26000")
    await userEvent.type(screen.getByLabelText("Emergency fund"), "6500")
    await userEvent.click(screen.getByRole("button", { name: /record 2 balances/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect([...onSubmit.mock.calls[0]![1]]).toStrictEqual([
      ["a1", "26000"],
      ["a2", "6500"]
    ])
  })

  it("counts only the fields actually filled in", async () => {
    render(form())

    await userEvent.type(screen.getByLabelText("Joint account"), "26000")

    expect(screen.getByRole("button", { name: /record 1 balance/i })).toBeInTheDocument()
  })

  it("cannot be submitted with nothing entered", () => {
    render(form())

    expect(screen.getByRole("button", { name: /record 0 balances/i })).toBeDisabled()
  })
})
