import {
  monthTicks,
  plotOfAmount,
  plotted,
  recordedUpTo,
  ticks
} from "@/modules/trajectory/core/domain/TrajectoryAxes"
import { ChartLegend } from "@/modules/trajectory/primary_adapters/react/components/ChartLegend"
import { CHART_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { TrajectoryCurve } from "@/modules/trajectory/core/domain/TrajectoryCurve"

export interface ProjectionChartProps {
  readonly curve: TrajectoryCurve
  readonly label: string
  /**
   * The dashboard shows this chart as one panel among several, the Projection
   * screen shows the same chart as the whole point of the page. Only the
   * aspect changes — a taller box at the same width, so the slope of the
   * forecast reads rather than flattening into the horizontal.
   */
  readonly size?: "panel" | "full"
}

const AREAS = {
  panel: { width: 640, height: 220 },
  full: { width: 640, height: 360 }
} as const

/** Room for the axis labels, which live outside the plot and would clip without it. */
const PADDING = { left: 54, right: 16, top: 24, bottom: 34 }

const MONTH_TICKS = 5

const path = (points: ReadonlyArray<{ readonly x: number; readonly y: number }>): string =>
  points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ")

/**
 * One line, a goal line, a mark where they meet, and the scale to read any of
 * it against (TRJ-07, APP-05).
 *
 * Drawn from `TrajectoryCurve`'s geometry rather than by a charting library,
 * because every criterion here is about restraint — straight segments, no area
 * fill, faint gridlines, a fixed tick interval — and each one would be an
 * argument with a library's defaults. The geometry is tested as pure
 * functions; this file only turns numbers into markup.
 *
 * **Greyscale-legible**: the forecast is dashed and the goal line is dotted,
 * so the three lines stay apart with no colour at all (design-brief.md
 * principle 5). Blue is a second signal on the forecast, never the only one.
 *
 * **No area fill**: a filled region under a forecast reads as a quantity that
 * has been accumulated. None of it has.
 */
export function ProjectionChart({ curve, label, size = "panel" }: ProjectionChartProps) {
  const area = AREAS[size]
  const points = plotted(curve, area)
  const boundary = recordedUpTo(curve)
  const solidUpTo = boundary === undefined ? 1 : boundary + 1
  const goalY = plotOfAmount(curve, curve.target, area)
  const crossesAt = curve.crossesAt
  const crossingIndex = curve.points.findIndex((point) => point.month === crossesAt)
  const crossing = crossesAt === undefined ? undefined : points[crossingIndex]
  const todayX = boundary === undefined ? undefined : points[boundary]?.x

  return (
    <figure className="flex flex-col gap-3">
      <ChartLegend target={curve.target} />

      <svg
        viewBox={`${-PADDING.left} ${-PADDING.top} ${area.width + PADDING.left + PADDING.right} ${
          area.height + PADDING.top + PADDING.bottom
        }`}
        role="img"
        aria-label={label}
        className="w-full"
      >
        {ticks(curve).map((tick) => {
          const y = plotOfAmount(curve, tick, area)
          return (
            <g key={String(tick)}>
              <line x1={0} x2={area.width} y1={y} y2={y} className="stroke-line" strokeWidth={1} />
              <text
                x={-10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted text-[11px]"
              >
                {MoneyText.compact(tick)}
              </text>
            </g>
          )
        })}

        {/*
            The outermost labels anchor inward rather than centring: a label
            centred on the last point hangs half its width past the plot and
            clips against the edge of the figure.
        */}
        {monthTicks(curve, MONTH_TICKS).map((tick) => (
          <text
            key={String(tick.month)}
            x={points[tick.index]?.x ?? 0}
            y={area.height + 20}
            textAnchor={
              tick.index === 0 ? "start" : tick.index === curve.points.length - 1 ? "end" : "middle"
            }
            className="fill-muted text-[11px]"
          >
            {DateText.shortMonth(tick.month)}
          </text>
        ))}

        {todayX === undefined ? null : (
          <g>
            <line
              x1={todayX}
              x2={todayX}
              y1={-6}
              y2={area.height}
              className="stroke-muted"
              strokeWidth={1}
            />
            <text x={todayX + 4} y={-12} className="fill-muted text-[10px] tracking-[0.08em]">
              {CHART_COPY.today}
            </text>
          </g>
        )}

        <line
          x1={0}
          x2={area.width}
          y1={goalY}
          y2={goalY}
          className="stroke-muted"
          strokeWidth={1.5}
          strokeDasharray="2 3"
        />

        {/* Solid: this is what happened. */}
        <path
          d={path(points.slice(0, Math.max(solidUpTo, 1)))}
          fill="none"
          className="stroke-ink"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Dashed: this has not happened, and says so without colour. */}
        <path
          d={path(points.slice(Math.max(solidUpTo - 1, 0)))}
          fill="none"
          className="stroke-forecast"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />

        {crossing === undefined || crossesAt === undefined ? null : (
          <g>
            <line
              x1={crossing.x}
              x2={crossing.x}
              y1={crossing.y}
              y2={area.height}
              className="stroke-forecast"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <circle
              cx={crossing.x}
              cy={crossing.y}
              r={4}
              className="fill-surface stroke-forecast"
              strokeWidth={2}
            />
            <text
              x={crossing.x}
              y={crossing.y - 12}
              textAnchor="end"
              className="fill-forecast text-[11px] font-medium"
            >
              {DateText.month(crossesAt)}
            </text>
          </g>
        )}
      </svg>
    </figure>
  )
}
