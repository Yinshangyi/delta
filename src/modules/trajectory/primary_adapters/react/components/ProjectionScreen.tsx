import { ProjectionChart } from "@/modules/trajectory/primary_adapters/react/components/ProjectionChart"
import { ProjectionTable } from "@/modules/trajectory/primary_adapters/react/components/ProjectionTable"

import type { ProjectionMonth } from "@/modules/trajectory/core/domain/ProjectionResult"
import type { TrajectoryCurve } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import type { PROJECTION_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import type * as YearMonth from "@/shared/domain/YearMonth"

export interface ProjectionScreenProps {
  readonly curve: TrajectoryCurve
  readonly months: ReadonlyArray<ProjectionMonth>
  readonly today: YearMonth.YearMonth
  readonly goalMonth: YearMonth.YearMonth | undefined
  readonly copy: typeof PROJECTION_COPY
}

/**
 * The chart and the table, at the size they deserve when they are the whole
 * screen rather than two panels on the dashboard.
 *
 * The table lives here and not on the dashboard. The dashboard's hierarchy
 * ends at the commitments worth surfacing and one primary action; a hundred
 * rows of month-by-month arithmetic underneath it competes with the target
 * date, which is the one thing that screen exists to say.
 */
export function ProjectionScreen({ curve, months, today, goalMonth, copy }: ProjectionScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted text-sm">{copy.subtitle}</p>
      </div>

      <section className="border-line bg-surface flex flex-col gap-3 rounded-lg border p-5">
        <h2 className="text-ink text-sm font-semibold">{copy.chartLabel}</h2>
        <ProjectionChart curve={curve} label={copy.chartLabel} size="full" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-ink text-sm font-semibold">{copy.tableTitle}</h2>
        <ProjectionTable months={months} today={today} goalMonth={goalMonth} />
      </section>
    </div>
  )
}
