import { useAtomValue } from "@effect/atom-react"
import { Match, Option } from "effect"

import { EmptyState } from "@/dsl/EmptyState"
import { FailureState } from "@/dsl/FailureState"
import { curveOf } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import { ProjectionScreen } from "@/modules/trajectory/primary_adapters/react/components/ProjectionScreen"
import {
  DEFECT_MESSAGE,
  messageFor,
  PROJECTION_COPY
} from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import { projectionAtom } from "@/modules/trajectory/primary_adapters/reactivity/ProjectionAtoms"
import { recordedCapitalAtom } from "@/modules/trajectory/primary_adapters/reactivity/TrajectoryAtoms"
import * as LocalDate from "@/shared/domain/LocalDate"
import { thisMonth } from "@/shared/presentation/Today"
import { resolveStream, valueOrUndefined } from "@/shared/reactivity/AsyncState"

/**
 * Reads the same `projectionAtom` the dashboard does, so a previewed scenario
 * shows here too without a second projection that could disagree (SCN-09).
 */
export function ProjectionContainer() {
  const projection = resolveStream(useAtomValue(projectionAtom))
  const recorded = valueOrUndefined(useAtomValue(recordedCapitalAtom))
  const copy = PROJECTION_COPY

  return Match.valueTags(projection, {
    Idle: () => <p className="text-muted text-sm">Loading…</p>,
    Loading: () => <p className="text-muted text-sm">Loading…</p>,
    Failure: ({ error }) => (
      <FailureState title="Could not work out your trajectory." detail={messageFor(error)} />
    ),
    Defect: () => (
      <FailureState title="Could not work out your trajectory." detail={DEFECT_MESSAGE} />
    ),
    Success: ({ value }) => {
      const found = Option.getOrUndefined(value)

      if (found === undefined) {
        return (
          <div className="flex max-w-3xl flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <EmptyState title={copy.noGoal} description={copy.noGoalNote} />
          </div>
        )
      }

      const goalMonth = Match.valueTags(found.result.status, {
        Reachable: (reachable) => LocalDate.toYearMonth(reachable.targetDate),
        NotReachable: () => undefined
      })

      return (
        <ProjectionScreen
          curve={curveOf(found.result, thisMonth(), recorded ?? [])}
          months={found.result.months}
          today={thisMonth()}
          goalMonth={goalMonth}
          copy={copy}
        />
      )
    }
  })
}
