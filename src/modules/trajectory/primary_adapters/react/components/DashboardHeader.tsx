import { Button } from "@/dsl/Button"
import { ScaleBar } from "@/dsl/ScaleBar"
import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as Money from "@/shared/domain/Money"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { Standing } from "@/modules/trajectory/core/domain/PlanVariance"
import type { Composition } from "@/modules/trajectory/primary_adapters/react/DashboardSummary"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as YearMonth from "@/shared/domain/YearMonth"
import type { ReactNode } from "react"

export interface DashboardHeaderProps {
  readonly targetDate: YearMonth.YearMonth | undefined
  readonly monthsRemaining: number | undefined
  readonly standing: Standing | undefined
  readonly capital: Money.Money
  readonly goal: Money.Money
  readonly composition: Composition
  /** Absent on a debt-free household, where it would duplicate capital (spec §77). */
  readonly netWorth: Money.Money | undefined
  readonly updated: LocalDate.LocalDate | undefined
  readonly onUpdateBalances: () => void
  readonly canUpdateBalances: boolean
  /** The unreachable case, which replaces the date rather than annotating it (TRJ-09). */
  readonly instead?: ReactNode
}

const percentOf = (capital: Money.Money, goal: Money.Money): number =>
  Money.isPositive(goal)
    ? Math.min(100, Math.round((Money.toCents(capital) / Money.toCents(goal)) * 100))
    : 0

const STANDING_LABEL: Record<Standing, string> = {
  "on-plan": DASHBOARD_COPY.target.onPlan,
  ahead: DASHBOARD_COPY.target.ahead,
  behind: DASHBOARD_COPY.target.behind
}

/**
 * The answer and the number that drives it, one glance apart (APP-03).
 *
 * The date is set at the display step and nothing else on any screen uses it,
 * which is principle 1 of design-brief.md made literal: currency supports the
 * date, it does not compete with it. Previously both rendered near the same
 * weight, which is most of why this screen read flatter than the mock.
 */
export function DashboardHeader(props: DashboardHeaderProps) {
  const copy = DASHBOARD_COPY

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted text-sm">
          {props.updated === undefined
            ? copy.header.neverUpdated
            : `${copy.header.updated} ${DateText.day(props.updated)}`}{" "}
          · {copy.header.privacy}
        </p>
      </div>

      <section className="border-line bg-surface grid gap-px overflow-hidden rounded-lg border lg:grid-cols-[3fr_2fr]">
        <TargetHalf {...props} />
        <CapitalHalf {...props} />
      </section>
    </div>
  )
}

function TargetHalf({ targetDate, monthsRemaining, standing, instead }: DashboardHeaderProps) {
  const copy = DASHBOARD_COPY.target

  if (instead !== undefined) {
    return <div className="bg-surface flex flex-col gap-3 p-6">{instead}</div>
  }

  return (
    <div className="bg-surface flex flex-col items-start gap-3 p-6">
      <p className="eyebrow">{copy.eyebrow}</p>

      <p className="text-ink text-display font-semibold">
        {targetDate === undefined ? "—" : DateText.month(targetDate)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-ink text-sm">
          {monthsRemaining === undefined
            ? ""
            : monthsRemaining === 0
              ? copy.thisMonth
              : `${monthsRemaining} ${copy.remaining}`}
        </p>
        {standing === undefined ? null : (
          <span className="border-line text-ink inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
            <span aria-hidden="true" className="bg-ink size-1.5 rounded-full" />
            {STANDING_LABEL[standing]}
          </span>
        )}
      </div>

      {/* Dashed, because the thing it qualifies is not a fact (spec §37). */}
      <p className="border-line text-muted rounded border border-dashed px-2 py-1 text-xs">
        {copy.basis}
      </p>
    </div>
  )
}

function CapitalHalf({
  capital,
  goal,
  composition,
  netWorth,
  onUpdateBalances,
  canUpdateBalances
}: DashboardHeaderProps) {
  const copy = DASHBOARD_COPY.capitalCard
  const percent = percentOf(capital, goal)
  const accounts = composition.accounts === 1 ? copy.account : copy.accounts
  const assets = composition.assets === 1 ? copy.asset : copy.assets

  return (
    <div className="bg-surface border-line flex flex-col gap-3 p-6 lg:border-l">
      <p className="eyebrow">{copy.eyebrow}</p>

      <p className="text-ink text-3xl font-semibold tracking-tight tabular-nums">
        {MoneyText.money(capital)}
      </p>

      <p className="text-muted text-sm">
        {composition.accounts} {accounts} · {composition.assets} {assets} · {percent}%{" "}
        {copy.reached}
      </p>

      {/*
          The goal lives on the bar rather than after an "of" above it. It is
          the bar's right edge — the thing the fill is a proportion of — and
          stating it here names it once, at a size worth reading, instead of
          twice within a few pixels.
      */}
      <ScaleBar
        percent={percent}
        label={DASHBOARD_COPY.reached}
        start={MoneyText.money(Money.zero)}
        end={MoneyText.money(goal)}
      />

      {netWorth === undefined ? null : (
        <div className="border-line flex items-baseline justify-between gap-3 border-t pt-3">
          <p className="text-muted text-sm">{DASHBOARD_COPY.netWorth}</p>
          <p className="text-ink text-sm font-medium tabular-nums">{MoneyText.money(netWorth)}</p>
        </div>
      )}

      <div className="mt-1 flex flex-wrap gap-2">
        <Button tone="primary" disabled={!canUpdateBalances} onClick={onUpdateBalances}>
          {DASHBOARD_COPY.updateBalances}
        </Button>
        <a
          href="#/capital"
          className="border-line text-ink bg-surface hover:bg-raised inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          {copy.capitalScreen}
        </a>
      </div>
    </div>
  )
}
