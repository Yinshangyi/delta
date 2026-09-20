import { plotOfAmount, plotted, ticks } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { TrajectoryCurve } from "@/modules/trajectory/core/domain/TrajectoryCurve"

export interface ProjectionChartProps {
  readonly curve: TrajectoryCurve
  readonly label: string
}

const AREA = { width: 640, height: 200 }
const PADDING = { left: 8, right: 8, top: 12, bottom: 24 }

const path = (points: ReadonlyArray<{ readonly x: number; readonly y: number }>): string =>
  points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ")

/**
 * One line, a goal line, and a mark where they meet (TRJ-07).
 *
 * Drawn from `TrajectoryCurve`'s geometry rather than by a charting library,
 * because every criterion on this ticket is about restraint — straight
 * segments, no area fill, faint gridlines, a fixed tick interval — and each
 * one would be an argument with a library's defaults. The geometry is tested
 * as pure functions; this file only turns numbers into markup.
 *
 * **Greyscale-legible**: the forecast is dashed and the goal line is dotted,
 * so the three lines stay apart with no colour at all (design-brief.md
 * principle 5). The recorded segment is solid because it is the one that
 * actually happened.
 *
 * **No area fill**: a filled region under a forecast reads as a quantity that
 * has been accumulated. None of it has.
 */
export function ProjectionChart({ curve, label }: ProjectionChartProps) {
  const points = plotted(curve, AREA)
  const recorded = curve.points.filter((point) => point.recorded).length
  const goalY = plotOfAmount(curve, curve.target, AREA)
  const crossing =
    curve.crossesAt === undefined
      ? undefined
      : points[curve.points.findIndex((point) => point.month === curve.crossesAt)]

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`${-PADDING.left} ${-PADDING.top} ${AREA.width + PADDING.left + PADDING.right} ${
          AREA.height + PADDING.top + PADDING.bottom
        }`}
        role="img"
        aria-label={label}
        className="w-full"
      >
        {ticks(curve).map((tick) => (
          <line
            key={String(tick)}
            x1={0}
            x2={AREA.width}
            y1={plotOfAmount(curve, tick, AREA)}
            y2={plotOfAmount(curve, tick, AREA)}
            className="stroke-line"
            strokeWidth={1}
          />
        ))}

        <line
          x1={0}
          x2={AREA.width}
          y1={goalY}
          y2={goalY}
          className="stroke-muted"
          strokeWidth={1.5}
          strokeDasharray="2 3"
        />

        {/* Solid: this is what happened. */}
        <path
          d={path(points.slice(0, Math.max(recorded, 1)))}
          fill="none"
          className="stroke-ink"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Dashed: this has not happened, and says so without colour. */}
        <path
          d={path(points.slice(Math.max(recorded - 1, 0)))}
          fill="none"
          className="stroke-ink"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />

        {crossing === undefined ? null : (
          <circle
            cx={crossing.x}
            cy={crossing.y}
            r={4}
            className="fill-surface stroke-ink"
            strokeWidth={2}
          />
        )}
      </svg>

      <figcaption className="text-muted flex items-center justify-between text-xs">
        <span>{curve.points[0] === undefined ? "" : DateText.month(curve.points[0].month)}</span>
        <span>
          {curve.crossesAt === undefined
            ? `goal ${MoneyText.money(curve.target)}`
            : `${MoneyText.money(curve.target)} in ${DateText.month(curve.crossesAt)}`}
        </span>
        <span>
          {curve.points.at(-1) === undefined ? "" : DateText.month(curve.points.at(-1)!.month)}
        </span>
      </figcaption>
    </figure>
  )
}
