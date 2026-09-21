import { render, screen, within } from "@testing-library/react"
import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import { ticks } from "@/modules/trajectory/core/domain/TrajectoryAxes"
import { curveOf } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import { ProjectionChart } from "@/modules/trajectory/primary_adapters/react/components/ProjectionChart"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))

const monthly = (from: string, count: number, amount: number, kind = "salary") =>
  Array.from({ length: count }, (_, index) =>
    CashFlow.make({
      date: LocalDate.lastDayOf(YearMonth.addMonths(ym(from), index)),
      amount: euros(amount),
      sourceId: kind,
      sourceKind: kind
    })
  )

const result = () =>
  project({
    cashFlows: [...monthly("2026-01", 24, 3_000), ...monthly("2026-01", 24, -1_200, "rent")],
    startingCapital: Money.zero,
    target: euros(20_000),
    from: ym("2026-01")
  })

const recorded = () => [
  { month: ym("2026-01"), amount: euros(1_800) },
  { month: ym("2026-02"), amount: euros(3_600) }
]

describe("the projection chart", () => {
  it("labels the value axis at amounts the chart reaches", () => {
    const curve = curveOf(result(), ym("2026-02"), [])
    render(<ProjectionChart curve={curve} label="chart" />)

    const chart = screen.getByRole("img", { name: "chart" })
    const labels = ticks(curve).map(MoneyText.compact)

    expect(labels.length).toBeGreaterThan(1)
    for (const label of labels) {
      expect(within(chart).getByText(label)).toBeInTheDocument()
    }
  })

  it("labels the time axis with the span it actually covers", () => {
    const curve = curveOf(result(), ym("2026-02"), [])
    render(<ProjectionChart curve={curve} label="chart" />)

    const chart = screen.getByRole("img", { name: "chart" })
    expect(within(chart).getByText(DateText.shortMonth(curve.points[0]!.month))).toBeInTheDocument()
    expect(
      within(chart).getByText(DateText.shortMonth(curve.points.at(-1)!.month))
    ).toBeInTheDocument()
  })

  it("names all three lines, each with its own dash pattern", () => {
    render(<ProjectionChart curve={curveOf(result(), ym("2026-02"), [])} label="chart" />)

    expect(screen.getByText("Actual")).toBeInTheDocument()
    expect(screen.getByText("Forecast")).toBeInTheDocument()
    expect(screen.getByText(/goal €20,000/i)).toBeInTheDocument()
  })

  it("marks today where recorded history stops", () => {
    render(<ProjectionChart curve={curveOf(result(), ym("2026-02"), recorded())} label="chart" />)

    expect(
      within(screen.getByRole("img", { name: "chart" })).getByText("TODAY")
    ).toBeInTheDocument()
  })

  it("marks today from the curve alone, with or without typed-in balances", () => {
    render(<ProjectionChart curve={curveOf(result(), ym("2026-02"), [])} label="chart" />)

    expect(
      within(screen.getByRole("img", { name: "chart" })).getByText("TODAY")
    ).toBeInTheDocument()
  })

  it("labels the month the forecast meets the goal", () => {
    const curve = curveOf(result(), ym("2026-02"), [])
    render(<ProjectionChart curve={curve} label="chart" />)

    expect(curve.crossesAt).toBeDefined()
    const chart = screen.getByRole("img", { name: "chart" })
    expect(within(chart).getAllByText(/\d{4}$/).length).toBeGreaterThan(0)
  })
})
