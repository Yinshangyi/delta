import { Match, Result } from "effect"
import { afterAll, describe, expect, it } from "vitest"

import { project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { ProjectionResult } from "@/modules/trajectory/core/domain/ProjectionResult"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))

const on = (month: YearMonth.YearMonth, day: number, amount: number, kind: string) =>
  new CashFlow.CashFlow({
    date: Result.getOrThrow(
      LocalDate.fromParts(YearMonth.year(month), YearMonth.month(month), day)
    ),
    amount: euros(amount),
    sourceId: kind,
    sourceKind: kind
  })

/**
 * One household, two earners and the commitments of a real month, run for as
 * long as it takes. Every figure is invented; none of it is anyone's data.
 */
const household = () =>
  YearMonth.range(ym("2026-01"), ym("2028-12")).flatMap((month) => {
    const august = YearMonth.month(month) === 8
    return [
      on(month, 5, august ? 7_200 : 10_800, "freelance"),
      on(month, 28, 2_880, "salary"),
      on(month, 1, -1_450, "rent"),
      on(month, 3, -620, "loan"),
      on(month, 10, -1_100, "living"),
      ...(YearMonth.month(month) === 9 ? [on(month, 15, -4_300, "tax")] : [])
    ]
  })

const statusOf = (status: ProjectionResult["status"]): string =>
  Match.valueTags(status, {
    Reachable: (reachable) =>
      `reachable on ${LocalDate.toIso(reachable.targetDate)} after ${reachable.monthsRemaining} months`,
    NotReachable: (not) => `not reachable (${not.reason})`
  })

const golden = (result: ProjectionResult): string =>
  [
    `starting savings  ${Money.toEuros(result.startingSavings).toFixed(2)}`,
    `target            ${Money.toEuros(result.targetAmount).toFixed(2)}`,
    `status            ${statusOf(result.status)}`,
    "",
    "month     start        income     commitments  net         end",
    ...result.months.map((month) =>
      [
        YearMonth.toIso(month.month).padEnd(9),
        Money.toEuros(month.startingSavings).toFixed(2).padEnd(12),
        Money.toEuros(month.income).toFixed(2).padEnd(10),
        Money.toEuros(month.commitments).toFixed(2).padEnd(12),
        Money.toEuros(month.netCashFlow).toFixed(2).padEnd(11),
        Money.toEuros(month.endingSavings).toFixed(2)
      ].join(" ")
    ),
    ""
  ].join("\n")

const run = () =>
  project({
    cashFlows: household(),
    startingCapital: euros(18_500),
    target: euros(120_000),
    from: ym("2026-01")
  })

describe("a realistic projection", () => {
  it("matches the golden file, so arithmetic changes surface as a diff", async () => {
    await expect(golden(run())).toMatchFileSnapshot("./__snapshots__/projection.golden.txt")
  })

  describe("under any host timezone", () => {
    const original = process.env["TZ"]
    afterAll(() => {
      process.env["TZ"] = original
    })

    it("is identical, because the engine holds no Date and reads no clock", () => {
      const rendered = ["UTC", "America/Los_Angeles", "Pacific/Kiritimati"].map((zone) => {
        process.env["TZ"] = zone
        return golden(run())
      })

      for (const other of rendered.slice(1)) expect(other).toBe(rendered[0])
    })
  })
})
