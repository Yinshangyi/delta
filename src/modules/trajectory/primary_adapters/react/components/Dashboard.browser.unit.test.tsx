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
import { DashboardHeader } from "@/modules/trajectory/primary_adapters/react/components/DashboardHeader"
import { ProjectionChart } from "@/modules/trajectory/primary_adapters/react/components/ProjectionChart"
import { ProjectionTable } from "@/modules/trajectory/primary_adapters/react/components/ProjectionTable"
import { TrajectoryBand } from "@/modules/trajectory/primary_adapters/react/components/TrajectoryBand"
import { UnreachableNotice } from "@/modules/trajectory/primary_adapters/react/components/UnreachableNotice"
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

const header = (over: Partial<Parameters<typeof DashboardHeader>[0]> = {}) => ({
  targetDate: ym("2028-10"),
  monthsRemaining: 23,
  standing: undefined,
  capital: euros(24_000),
  goal: euros(150_000),
  composition: { accounts: 2, assets: 1 },
  netWorth: undefined,
  updated: date("2026-11-03"),
  canUpdateBalances: true,
  onUpdateBalances: () => {},
  ...over
})

describe("the dashboard header", () => {
  it("leads with the date and labels it an estimate (spec §37)", () => {
    render(<DashboardHeader {...header()} />)

    expect(screen.getByText("October 2028")).toBeInTheDocument()
    expect(screen.getByText(/based on your current trajectory/i)).toBeInTheDocument()
  })

  it("says how many months are left, and what standing that is", () => {
    render(<DashboardHeader {...header({ standing: "behind" })} />)

    expect(screen.getByText("23 months remaining")).toBeInTheDocument()
    expect(screen.getByText("behind")).toBeInTheDocument()
  })

  it("reads a target reached this month as nought months, never minus one", () => {
    render(<DashboardHeader {...header({ monthsRemaining: 0 })} />)

    expect(screen.getByText(/reached this month/i)).toBeInTheDocument()
  })

  it("states capital, its composition and how much of the goal is reached", () => {
    render(<DashboardHeader {...header({ capital: euros(30_000) })} />)

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20")
    expect(screen.getByText(/2 accounts · 1 asset · 20% reached/i)).toBeInTheDocument()
  })

  it("counts one account and one asset in the singular", () => {
    render(<DashboardHeader {...header({ composition: { accounts: 1, assets: 1 } })} />)

    expect(screen.getByText(/1 account · 1 asset/i)).toBeInTheDocument()
  })

  it("hides net worth where nothing is owed (spec §77)", () => {
    render(<DashboardHeader {...header()} />)

    expect(screen.queryByText(/net worth/i)).not.toBeInTheDocument()
  })

  it("shows net worth as a quieter second figure where debt exists", () => {
    render(<DashboardHeader {...header({ netWorth: euros(16_200) })} />)

    expect(screen.getByText(/net worth/i)).toBeInTheDocument()
    expect(screen.getByText("€16,200")).toBeInTheDocument()
  })

  it("says when the figures were last updated, and that nothing leaves the machine", () => {
    render(<DashboardHeader {...header()} />)

    expect(screen.getByText(/updated 03 nov 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing leaves this machine/i)).toBeInTheDocument()
  })

  it("says so plainly before any balance has been recorded", () => {
    render(<DashboardHeader {...header({ updated: undefined })} />)

    expect(screen.getByText(/no balances recorded yet/i)).toBeInTheDocument()
  })

  it("offers exactly one primary action (design-brief principle 4)", () => {
    render(<DashboardHeader {...header()} />)

    expect(screen.getByRole("button", { name: /update balances/i })).toBeEnabled()
    expect(screen.getByRole("link", { name: /^capital$/i })).toHaveAttribute("href", "#/capital")
  })

  it("replaces the date entirely when the goal cannot be reached (TRJ-09)", () => {
    render(
      <DashboardHeader
        {...header({
          targetDate: undefined,
          instead: (
            <UnreachableNotice
              shortfall={{ monthly: euros(-400), reason: "so the goal is never reached." }}
            />
          )
        })}
      />
    )

    expect(screen.queryByText("October 2028")).not.toBeInTheDocument()
    expect(screen.getByText(/not reachable on the current trajectory/i)).toBeInTheDocument()
  })
})

describe("the unreachable notice", () => {
  it("answers rather than erroring (TRJ-09)", () => {
    render(
      <UnreachableNotice
        shortfall={{ monthly: euros(-400), reason: "so the goal is never reached." }}
      />
    )

    expect(screen.getByText(/losing about/i)).toBeInTheDocument()
    expect(screen.getByText("€400")).toBeInTheDocument()
    expect(screen.getByText(/try a scenario/i)).toBeInTheDocument()
  })

  it("tells the fifty-year horizon apart from a losing trajectory (TRJ-09)", () => {
    render(
      <UnreachableNotice
        shortfall={{ monthly: euros(20), reason: "so the goal is not reached within fifty years." }}
      />
    )

    expect(screen.getByText(/within fifty years/i)).toBeInTheDocument()
  })
})

describe("the trajectory band", () => {
  it("gives the typical month and says that is what it is (TRJ-06)", () => {
    render(<TrajectoryBand outlook={outlookOver(steady())} commitmentCount={1} />)

    expect(screen.getByText("€3,000")).toBeInTheDocument()
    expect(screen.getByText("€1,200")).toBeInTheDocument()
    expect(screen.getByText(/what most months look like/i)).toBeInTheDocument()
  })

  it("counts the active commitments and says tax is scheduled apart", () => {
    render(<TrajectoryBand outlook={outlookOver(steady())} commitmentCount={7} />)

    expect(screen.getByText(/7 active · tax scheduled separately/i)).toBeInTheDocument()
  })

  it("states the average including scheduled payments where months differ", () => {
    const lumpy = project({
      cashFlows: [...monthly("2026-01", 12, 2_000), ...monthly("2026-09", 1, -12_000, "tax")],
      startingCapital: Money.zero,
      target: euros(500_000),
      from: ym("2026-01")
    })

    render(<TrajectoryBand outlook={outlookOver(lumpy, 12)} commitmentCount={1} />)

    expect(screen.getByText(/including scheduled payments such as tax/i)).toBeInTheDocument()
    expect(screen.getByText("€1,000")).toBeInTheDocument()
  })

  it("names what the third figure is where nothing lumpy is coming", () => {
    render(<TrajectoryBand outlook={outlookOver(steady())} commitmentCount={1} />)

    expect(screen.getByText(/income less commitments/i)).toBeInTheDocument()
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
    // The glyph and the word both, so the standing survives greyscale.
    expect(screen.getByText("↑")).toBeInTheDocument()
    expect(screen.getByText("later")).toBeInTheDocument()
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
