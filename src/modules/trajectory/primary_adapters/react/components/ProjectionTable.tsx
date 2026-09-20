import { useState } from "react"

import { Badge } from "@/dsl/Badge"
import { Button } from "@/dsl/Button"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { ProjectionMonth } from "@/modules/trajectory/core/domain/ProjectionResult"

export interface ProjectionTableProps {
  readonly months: ReadonlyArray<ProjectionMonth>
  readonly today: YearMonth.YearMonth
  readonly goalMonth: YearMonth.YearMonth | undefined
}

const isPast = (month: ProjectionMonth, today: YearMonth.YearMonth) =>
  !YearMonth.isAfter(month.month, today)

/**
 * The projection month by month (TRJ-08), with each row expandable into the
 * flows that produced it.
 *
 * The expansion is the point. A month showing €14,753 against a usual €8,340
 * is unexplainable from anywhere else in the app, and §31 already carries the
 * flows per month — they only have to be shown.
 *
 * **A past row is not recorded fact.** Delta reconstructs it from today's
 * configuration, so it is labelled "reconstructed" rather than "actual": the
 * household did not necessarily earn that in March, it is what March would
 * have looked like given what Delta knows now.
 */
export function ProjectionTable({ months, today, goalMonth }: ProjectionTableProps) {
  const [expanded, setExpanded] = useState<string | undefined>(undefined)

  return (
    <div className="flex flex-col gap-3">
      {goalMonth === undefined ? null : (
        <div>
          <Button
            onClick={() => {
              document
                .getElementById(`month-${YearMonth.toIso(goalMonth)}`)
                ?.scrollIntoView({ block: "center" })
            }}
          >
            Jump to {DateText.month(goalMonth)}
          </Button>
        </div>
      )}

      <div className="border-line bg-surface overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">Month by month projection</caption>
          <thead>
            <tr className="border-line border-b">
              <th scope="col" className="text-muted px-3 py-2 text-left font-medium">
                Month
              </th>
              <th scope="col" className="text-muted px-3 py-2 text-right font-medium">
                Start
              </th>
              <th scope="col" className="text-muted px-3 py-2 text-right font-medium">
                Income
              </th>
              <th scope="col" className="text-muted px-3 py-2 text-right font-medium">
                Commitments
              </th>
              <th scope="col" className="text-muted px-3 py-2 text-right font-medium">
                Net
              </th>
              <th scope="col" className="text-muted px-3 py-2 text-right font-medium">
                End
              </th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => {
              const iso = YearMonth.toIso(month.month)
              const open = expanded === iso
              return (
                <ProjectionRows
                  key={iso}
                  month={month}
                  past={isPast(month, today)}
                  open={open}
                  onToggle={() => setExpanded(open ? undefined : iso)}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ProjectionRowsProps {
  readonly month: ProjectionMonth
  readonly past: boolean
  readonly open: boolean
  readonly onToggle: () => void
}

function ProjectionRows({ month, past, open, onToggle }: ProjectionRowsProps) {
  const iso = YearMonth.toIso(month.month)

  return (
    <>
      <tr id={`month-${iso}`} className="border-line border-b last:border-b-0">
        <th scope="row" className="px-3 py-2 text-left font-normal">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="flex items-center gap-2"
          >
            <span className="text-ink">{DateText.month(month.month)}</span>
            <Badge kind={past ? "actual" : "forecast"} />
          </button>
        </th>
        <td className="text-muted px-3 py-2 text-right tabular-nums">
          {MoneyText.money(month.startingSavings)}
        </td>
        <td className="text-muted px-3 py-2 text-right tabular-nums">
          {MoneyText.money(month.income)}
        </td>
        <td className="text-muted px-3 py-2 text-right tabular-nums">
          {MoneyText.money(month.commitments)}
        </td>
        <td
          className={`px-3 py-2 text-right tabular-nums ${
            Money.isNegative(month.netCashFlow) ? "text-negative" : "text-ink"
          }`}
        >
          {MoneyText.money(month.netCashFlow)}
        </td>
        <td className="text-ink px-3 py-2 text-right font-medium tabular-nums">
          {MoneyText.money(month.endingSavings)}
        </td>
      </tr>

      {open ? (
        <tr className="border-line bg-raised border-b last:border-b-0">
          <td colSpan={6} className="px-3 py-3">
            {past ? (
              <p className="text-muted mb-2 text-xs">
                Reconstructed from what Delta knows today, not a record of what happened.
              </p>
            ) : null}
            {month.cashFlows.length === 0 ? (
              <p className="text-muted text-xs">Nothing moved this month.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {month.cashFlows.map((flow, index) => (
                  <li
                    key={`${flow.sourceId}-${index}`}
                    className="flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="text-muted">
                      {DateText.day(flow.date)} · {flow.sourceKind}
                    </span>
                    <span
                      className={`tabular-nums ${
                        Money.isNegative(flow.amount) ? "text-negative" : "text-ink"
                      }`}
                    >
                      {MoneyText.money(flow.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      ) : null}
    </>
  )
}
