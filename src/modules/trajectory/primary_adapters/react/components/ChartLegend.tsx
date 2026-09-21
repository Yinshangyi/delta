import { CHART_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type * as Money from "@/shared/domain/Money"

/**
 * Names the three lines (APP-05). Each swatch repeats the line's dash pattern
 * rather than only its colour, so the legend is legible on the same terms as
 * the chart it explains.
 */
export function ChartLegend({ target }: { readonly target: Money.Money }) {
  return (
    <ul className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <Entry label={CHART_COPY.actual} stroke="stroke-ink" />
      <Entry label={CHART_COPY.forecast} stroke="stroke-forecast" dash="5 4" />
      <Entry
        label={`${CHART_COPY.goal} ${MoneyText.money(target)}`}
        stroke="stroke-muted"
        dash="2 3"
      />
    </ul>
  )
}

interface EntryProps {
  readonly label: string
  readonly stroke: string
  readonly dash?: string
}

function Entry({ label, stroke, dash }: EntryProps) {
  return (
    <li className="flex items-center gap-1.5">
      <svg viewBox="0 0 22 2" aria-hidden="true" className="h-0.5 w-[22px] overflow-visible">
        <line
          x1={0}
          x2={22}
          y1={1}
          y2={1}
          className={stroke}
          strokeWidth={2}
          strokeDasharray={dash}
        />
      </svg>
      {label}
    </li>
  )
}
