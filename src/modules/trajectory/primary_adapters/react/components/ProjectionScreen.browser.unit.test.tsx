import { render, screen } from "@testing-library/react"
import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import { curveOf } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import { ProjectionChart } from "@/modules/trajectory/primary_adapters/react/components/ProjectionChart"
import { ProjectionScreen } from "@/modules/trajectory/primary_adapters/react/components/ProjectionScreen"
import { PROJECTION_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

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

const steady = () =>
  project({
    cashFlows: [...monthly("2026-01", 12, 3_000), ...monthly("2026-01", 12, -1_200, "rent")],
    startingCapital: Money.zero,
    target: euros(9_000),
    from: ym("2026-01")
  })

const renderScreen = () => {
  const result = steady()
  render(
    <ProjectionScreen
      curve={curveOf(result, ym("2026-03"), [])}
      months={result.months}
      today={ym("2026-03")}
      goalMonth={ym("2026-05")}
      copy={PROJECTION_COPY}
    />
  )
  return result
}

describe("the projection screen", () => {
  it("shows the chart and the month-by-month table together", () => {
    renderScreen()

    expect(screen.getByRole("img", { name: PROJECTION_COPY.chartLabel })).toBeInTheDocument()
    expect(screen.getByRole("table", { name: /month by month projection/i })).toBeInTheDocument()
  })

  it("draws the chart taller here than in a dashboard panel", () => {
    const result = steady()
    const curve = curveOf(result, ym("2026-03"), [])
    const heightOf = (element: Element) => Number(element.getAttribute("viewBox")?.split(" ")[3])

    const panel = render(<ProjectionChart curve={curve} label="panel" />)
    const panelHeight = heightOf(panel.getByRole("img", { name: "panel" }))
    panel.unmount()

    renderScreen()
    const full = screen.getByRole("img", { name: PROJECTION_COPY.chartLabel })

    expect(heightOf(full)).toBeGreaterThan(panelHeight)
  })

  it("keeps a row for every month of the projection", () => {
    const result = renderScreen()

    expect(screen.getAllByRole("row")).toHaveLength(result.months.length + 1)
  })
})
