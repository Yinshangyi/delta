/**
 * Cash flows folded into months — the first of TRJ-04's three seams.
 *
 * Income and commitments are told apart by sign, never by where they came
 * from: spec §30 defines commitments as the negative flows, and an engine that
 * asked which module produced a flow would be the special-casing §29 exists to
 * prevent. A negative freelance month and a negative rent are the same thing
 * here.
 */
import { Data } from "effect"

import * as CashFlow from "@/shared/domain/CashFlow"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

export class MonthlyFlows extends Data.Class<{
  readonly month: YearMonth.YearMonth
  readonly income: Money.Money
  /** Negative, as spec §30 has it, so the net is an addition. */
  readonly commitments: Money.Money
  readonly flows: ReadonlyArray<CashFlow.CashFlow>
}> {}

export const netOf = (flows: MonthlyFlows): Money.Money =>
  Money.add(flows.income, flows.commitments)

export const empty = (month: YearMonth.YearMonth): MonthlyFlows =>
  new MonthlyFlows({ month, income: Money.zero, commitments: Money.zero, flows: [] })

const foldMonth = (
  month: YearMonth.YearMonth,
  flows: ReadonlyArray<CashFlow.CashFlow>
): MonthlyFlows =>
  new MonthlyFlows({
    month,
    income: Money.sum(flows.map((flow) => flow.amount).filter(Money.isPositive)),
    commitments: Money.sum(flows.map((flow) => flow.amount).filter(Money.isNegative)),
    flows
  })

export const groupByMonth = (
  flows: ReadonlyArray<CashFlow.CashFlow>
): ReadonlyMap<YearMonth.YearMonth, MonthlyFlows> => {
  const buckets = new Map<YearMonth.YearMonth, Array<CashFlow.CashFlow>>()
  for (const flow of flows) {
    const month = CashFlow.monthOf(flow)
    const bucket = buckets.get(month)
    if (bucket === undefined) buckets.set(month, [flow])
    else bucket.push(flow)
  }

  return new Map([...buckets].map(([month, bucket]) => [month, foldMonth(month, bucket)]))
}

/**
 * The same, but over a stated range: every month is present, and a month with
 * nothing in it is a zero rather than a gap (TRJ-02).
 *
 * The distinction matters downstream. A table skipping quiet months reads as
 * missing data, and a chart joining across them would draw a slope where the
 * balance was in fact flat.
 */
export const groupOver = (
  flows: ReadonlyArray<CashFlow.CashFlow>,
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
): ReadonlyArray<MonthlyFlows> => {
  const byMonth = groupByMonth(flows)
  return YearMonth.range(from, to).map((month) => byMonth.get(month) ?? empty(month))
}
