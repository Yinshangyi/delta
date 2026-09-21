import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react"
import { Exit, Match, Option } from "effect"
import { useState } from "react"

import { Button } from "@/dsl/Button"
import { FailureState } from "@/dsl/FailureState"
import {
  capitalOverviewAtom,
  netWorthAtom
} from "@/modules/capital/primary_adapters/reactivity/CapitalAtoms"
import { commitmentsOverviewAtom } from "@/modules/commitments/primary_adapters/reactivity/CommitmentAtoms"
import { outlookOver } from "@/modules/trajectory/core/domain/MonthlyOutlook"
import { averageMonthlyNet } from "@/modules/trajectory/core/domain/Shortfall"
import { curveOf } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import { commitmentsAhead } from "@/modules/trajectory/primary_adapters/react/CommitmentsAhead"
import { CommitmentsAheadPanel } from "@/modules/trajectory/primary_adapters/react/components/CommitmentsAheadPanel"
import { ProjectionChart } from "@/modules/trajectory/primary_adapters/react/components/ProjectionChart"
import { TargetDatePanel } from "@/modules/trajectory/primary_adapters/react/components/TargetDatePanel"
import { TrajectoryPanel } from "@/modules/trajectory/primary_adapters/react/components/TrajectoryPanel"
import { UpdateBalancesForm } from "@/modules/trajectory/primary_adapters/react/components/UpdateBalancesForm"
import { VariancePanel } from "@/modules/trajectory/primary_adapters/react/components/VariancePanel"
import {
  DASHBOARD_COPY,
  DEFECT_MESSAGE,
  messageFor
} from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import { projectionAtom } from "@/modules/trajectory/primary_adapters/reactivity/ProjectionAtoms"
import {
  dashboardHoldingsAtom,
  planVarianceAtom,
  recordedCapitalAtom,
  recordManyValuationsAtom
} from "@/modules/trajectory/primary_adapters/reactivity/TrajectoryAtoms"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import { today, thisMonth } from "@/shared/presentation/Today"
import {
  type AsyncState,
  resolveMutation,
  resolveStream,
  valueOrUndefined
} from "@/shared/reactivity/AsyncState"

import type { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"
import type { PlanVariance } from "@/modules/trajectory/core/domain/PlanVariance"
import type { RecordedPoint } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import type { NetWorth } from "@/modules/trajectory/core/use_cases/NetWorthQuery"
import type { Projection } from "@/modules/trajectory/core/use_cases/ProjectionQuery"
import type { CommitmentAhead } from "@/modules/trajectory/primary_adapters/react/components/CommitmentsAheadPanel"
import type { TrajectoryFailure } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"

const errorOf = (state: AsyncState<unknown, TrajectoryFailure>): string | undefined =>
  Match.valueTags(state, {
    Idle: () => undefined,
    Loading: () => undefined,
    Success: () => undefined,
    Failure: ({ error }) => messageFor(error),
    Defect: () => DEFECT_MESSAGE
  })

export function DashboardContainer() {
  const projection = resolveStream(useAtomValue(projectionAtom))
  const worth = valueOrUndefined(useAtomValue(netWorthAtom))
  const variance = valueOrUndefined(useAtomValue(planVarianceAtom))
  const holdings = valueOrUndefined(useAtomValue(dashboardHoldingsAtom))
  const commitments = valueOrUndefined(useAtomValue(commitmentsOverviewAtom))
  const recorded = valueOrUndefined(useAtomValue(recordedCapitalAtom))

  return Match.valueTags(projection, {
    Idle: () => <p className="text-muted text-sm">Loading…</p>,
    Loading: () => <p className="text-muted text-sm">Loading…</p>,
    Failure: ({ error }) => (
      <FailureState title="Could not work out your trajectory." detail={messageFor(error)} />
    ),
    Defect: () => (
      <FailureState title="Could not work out your trajectory." detail={DEFECT_MESSAGE} />
    ),
    Success: ({ value }) => (
      <Dashboard
        projection={Option.getOrUndefined(value)}
        netWorth={worth}
        variance={variance === undefined ? undefined : Option.getOrUndefined(variance)}
        holdings={holdings === undefined ? [] : [...holdings.accounts, ...holdings.assets]}
        ahead={
          commitments === undefined
            ? []
            : commitmentsAhead(commitments.commitments, commitments.positions)
        }
        recorded={recorded ?? []}
      />
    )
  })
}

interface DashboardProps {
  readonly projection: Projection | undefined
  readonly netWorth: NetWorth | undefined
  readonly variance: PlanVariance | undefined
  readonly holdings: ReadonlyArray<ValuedHolding>
  readonly ahead: ReadonlyArray<CommitmentAhead>
  readonly recorded: ReadonlyArray<RecordedPoint>
}

function Dashboard({ projection, netWorth, variance, holdings, ahead, recorded }: DashboardProps) {
  const copy = DASHBOARD_COPY
  const [updating, setUpdating] = useState(false)

  const record = resolveMutation(useAtomValue(recordManyValuationsAtom))
  const runRecord = useAtomSet(recordManyValuationsAtom, { mode: "promiseExit" })
  const refreshProjection = useAtomRefresh(projectionAtom)
  const refreshVariance = useAtomRefresh(planVarianceAtom)
  const refreshHoldings = useAtomRefresh(dashboardHoldingsAtom)
  const refreshCapital = useAtomRefresh(capitalOverviewAtom)
  const refreshWorth = useAtomRefresh(netWorthAtom)
  const refreshRecorded = useAtomRefresh(recordedCapitalAtom)

  const submit = async (date: string, amounts: ReadonlyMap<string, string>) => {
    const exit = await runRecord({
      entries: holdings.map((valued) => ({
        holding: valued.holding,
        amountEuros: amounts.get(valued.holding.id) ?? ""
      })),
      date,
      today: today()
    })
    if (!Exit.isSuccess(exit)) return false
    refreshProjection()
    refreshVariance()
    refreshHoldings()
    refreshCapital()
    refreshWorth()
    refreshRecorded()
    setUpdating(false)
    return true
  }

  if (projection === undefined) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <section className="border-line bg-surface flex flex-col gap-2 rounded-lg border p-6">
          <p className="text-ink text-lg font-medium">{copy.unreachable.noGoal}</p>
          <p className="text-muted text-sm">{copy.unreachable.noGoalNote}</p>
        </section>
      </div>
    )
  }

  const reached = Match.valueTags(projection.result.status, {
    Reachable: (reachable) => LocalDate.toYearMonth(reachable.targetDate),
    NotReachable: () => undefined
  })

  const shortfall = Match.valueTags(projection.result.status, {
    Reachable: () => undefined,
    NotReachable: (not) => {
      const monthly = averageMonthlyNet(projection.result)
      return monthly === undefined
        ? undefined
        : {
            monthly,
            reason: not.reason === "horizon" ? copy.unreachable.horizon : copy.unreachable.never
          }
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        {/* Exactly one primary action on this screen (TRJ-06). */}
        <Button tone="primary" disabled={holdings.length === 0} onClick={() => setUpdating(true)}>
          {copy.updateBalances}
        </Button>
      </div>

      <TargetDatePanel
        targetDate={reached}
        capital={projection.startingCapital}
        goal={projection.goal.targetAmount}
        netWorth={
          netWorth === undefined || Money.isZero(netWorth.outstandingDebt)
            ? undefined
            : netWorth.netWorth
        }
        shortfall={shortfall}
      />

      <section className="border-line bg-surface flex flex-col gap-3 rounded-lg border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink text-sm font-semibold">{copy.chartLabel}</h2>
          {/* The month-by-month table lives on Projection, so say where. */}
          <a
            href="#/projection"
            className="text-muted hover:text-ink text-sm underline underline-offset-2"
          >
            {copy.everyMonth}
          </a>
        </div>
        <ProjectionChart
          curve={curveOf(projection.result, thisMonth(), recorded)}
          label={copy.chartLabel}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrajectoryPanel outlook={outlookOver(projection.result)} />
        <VariancePanel variance={variance} />
        <CommitmentsAheadPanel commitments={ahead} />
      </div>

      {updating ? (
        <UpdateBalancesForm
          holdings={holdings}
          today={today()}
          busy={false}
          error={errorOf(record)}
          onSubmit={submit}
          onCancel={() => setUpdating(false)}
        />
      ) : null}
    </div>
  )
}
