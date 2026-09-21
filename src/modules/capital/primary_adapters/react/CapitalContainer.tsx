import { useAtomValue } from "@effect/atom-react"
import { Exit, Match, Option } from "effect"
import { useState } from "react"

import { EmptyState } from "@/dsl/EmptyState"
import { FailureState } from "@/dsl/FailureState"
import { countsTowardCapital } from "@/modules/capital/core/domain/Holding"
import { CapitalScreen } from "@/modules/capital/primary_adapters/react/CapitalScreen"
import {
  CAPITAL_COPY,
  DEFECT_MESSAGE,
  messageFor
} from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import { CapitalHeadline } from "@/modules/capital/primary_adapters/react/components/CapitalHeadline"
import { CapitalTotalRow } from "@/modules/capital/primary_adapters/react/components/CapitalTotalRow"
import { DeleteHoldingDialog } from "@/modules/capital/primary_adapters/react/components/DeleteHoldingDialog"
import { HoldingDetailPanel } from "@/modules/capital/primary_adapters/react/components/HoldingDetailPanel"
import {
  HoldingForm,
  type HoldingFormState
} from "@/modules/capital/primary_adapters/react/components/HoldingForm"
import { HoldingGroup } from "@/modules/capital/primary_adapters/react/components/HoldingGroup"
import { summarise } from "@/modules/capital/primary_adapters/react/HoldingSummary"
import {
  addHoldingAtom,
  capitalOverviewAtom,
  deleteHoldingAtom,
  netWorthAtom,
  recordValuationAtom,
  removeValuationAtom,
  setHoldingIncludedAtom
} from "@/modules/capital/primary_adapters/reactivity/CapitalAtoms"
import { useCapitalMutation } from "@/modules/capital/primary_adapters/reactivity/useCapitalMutation"
import { projectionAtom } from "@/modules/trajectory/primary_adapters/reactivity/ProjectionAtoms"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import { today } from "@/shared/presentation/Today"
import { type AsyncState, resolveStream } from "@/shared/reactivity/AsyncState"

import type { HoldingId, HoldingKind } from "@/modules/capital/core/domain/Holding"
import type { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"
import type { CapitalOverview } from "@/modules/capital/core/use_cases/CapitalOverviewQuery"
import type { CapitalFailure } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { NetWorth } from "@/modules/trajectory/core/use_cases/NetWorthQuery"
import type { Projection } from "@/modules/trajectory/core/use_cases/ProjectionQuery"
import type * as YearMonth from "@/shared/domain/YearMonth"

export interface CapitalContainerProps {
  readonly household: HouseholdId
}

const errorOf = (state: AsyncState<unknown, CapitalFailure>): string | undefined =>
  Match.valueTags(state, {
    Idle: () => undefined,
    Loading: () => undefined,
    Success: () => undefined,
    Failure: ({ error }) => messageFor(error),
    Defect: () => DEFECT_MESSAGE
  })

const isBusy = (state: AsyncState<unknown, CapitalFailure>): boolean =>
  Match.valueTags(state, {
    Idle: () => false,
    Loading: () => true,
    Success: () => false,
    Failure: () => false,
    Defect: () => false
  })

const targetDateOf = (projection: Projection | undefined): YearMonth.YearMonth | undefined =>
  projection === undefined
    ? undefined
    : Match.valueTags(projection.result.status, {
        Reachable: (reachable) => LocalDate.toYearMonth(reachable.targetDate),
        NotReachable: () => undefined
      })

export function CapitalContainer({ household }: CapitalContainerProps) {
  const overview = resolveStream(useAtomValue(capitalOverviewAtom))
  const worth = resolveStream(useAtomValue(netWorthAtom))
  const projection = resolveStream(useAtomValue(projectionAtom))

  return Match.valueTags(overview, {
    Idle: () => <p className="text-muted text-sm">Loading…</p>,
    Loading: () => <p className="text-muted text-sm">Loading…</p>,
    Failure: ({ error }) => (
      <FailureState title="Could not load your capital." detail={messageFor(error)} />
    ),
    Defect: () => <FailureState title="Could not load your capital." detail={DEFECT_MESSAGE} />,
    Success: ({ value }) => (
      <Capital
        household={household}
        overview={value}
        netWorth={Match.valueTags(worth, {
          Idle: () => undefined,
          Loading: () => undefined,
          Success: ({ value: computed }) => computed,
          Failure: () => undefined,
          Defect: () => undefined
        })}
        projection={Match.valueTags(projection, {
          Idle: () => undefined,
          Loading: () => undefined,
          Success: ({ value: current }) => Option.getOrUndefined(current),
          Failure: () => undefined,
          Defect: () => undefined
        })}
        hasGoal={Match.valueTags(projection, {
          Idle: () => true,
          Loading: () => true,
          Success: ({ value: current }) => Option.isSome(current),
          Failure: () => true,
          Defect: () => true
        })}
      />
    )
  })
}

interface CapitalProps {
  readonly household: HouseholdId
  readonly overview: CapitalOverview
  readonly netWorth: NetWorth | undefined
  readonly projection: Projection | undefined
  readonly hasGoal: boolean
}

function Capital({ household, overview, netWorth, projection, hasGoal }: CapitalProps) {
  const add = useCapitalMutation(addHoldingAtom)
  const record = useCapitalMutation(recordValuationAtom)
  const removeValuation = useCapitalMutation(removeValuationAtom)
  const include = useCapitalMutation(setHoldingIncludedAtom)
  const remove = useCapitalMutation(deleteHoldingAtom)

  const [selected, setSelected] = useState<HoldingId | undefined>(undefined)
  const [adding, setAdding] = useState<HoldingKind | undefined>(undefined)
  const [deleting, setDeleting] = useState<ValuedHolding | undefined>(undefined)

  const busy = [add, record, removeValuation, include, remove].some((mutation) =>
    isBusy(mutation.state)
  )
  const all = [...overview.accounts, ...overview.assets]
  const current = all.find((each) => each.holding.id === selected)
  const historyOf = (holding: HoldingId) =>
    overview.history.filter((snapshot) => snapshot.holdingId === holding)

  const submit = async (kind: HoldingKind, state: HoldingFormState): Promise<boolean> => {
    const exit = await add.run(
      kind === "BankAccount"
        ? {
            kind: "BankAccount",
            household,
            name: state.name,
            institution: state.institution === "" ? undefined : state.institution,
            openingBalanceEuros: Number(state.valueEuros),
            balanceDate: state.valuationDate,
            today: today()
          }
        : {
            kind: "PhysicalAsset",
            household,
            name: state.name,
            category: state.category === "" ? undefined : state.category,
            resaleValueEuros: Number(state.valueEuros),
            valuationDate: state.valuationDate,
            acquisitionCostEuros:
              state.acquisitionCostEuros === "" ? undefined : Number(state.acquisitionCostEuros),
            acquisitionDate: state.acquisitionDate === "" ? undefined : state.acquisitionDate,
            today: today()
          }
    )
    if (!Exit.isSuccess(exit)) return false
    setAdding(undefined)
    return true
  }

  const summaries = (valued: ReadonlyArray<ValuedHolding>) =>
    valued.map((each) => summarise(each, today()))

  return (
    <>
      <CapitalScreen
        headline={
          <CapitalHeadline
            total={overview.total}
            netWorth={
              netWorth === undefined || Money.isZero(netWorth.outstandingDebt)
                ? undefined
                : netWorth.netWorth
            }
            targetDate={targetDateOf(projection)}
            hasGoal={hasGoal}
            goal={projection?.goal.targetAmount}
            accounts={overview.accounts.length}
            assets={overview.assets.length}
            excluded={all.filter((valued) => !countsTowardCapital(valued.holding)).length}
          />
        }
        groups={
          all.length === 0 ? (
            <>
              <EmptyState title={CAPITAL_COPY.empty} description={CAPITAL_COPY.emptyDescription} />
              <HoldingGroup
                title={CAPITAL_COPY.accounts}
                caption={CAPITAL_COPY.accountsNote}
                summaries={[]}
                selected={undefined}
                onSelect={() => {}}
                onToggleIncluded={() => {}}
                addLabel={CAPITAL_COPY.addAccount}
                onAdd={() => setAdding("BankAccount")}
                busy={busy}
              />
              <HoldingGroup
                title={CAPITAL_COPY.assets}
                caption={CAPITAL_COPY.assetsNote}
                summaries={[]}
                selected={undefined}
                onSelect={() => {}}
                onToggleIncluded={() => {}}
                addLabel={CAPITAL_COPY.addAsset}
                onAdd={() => setAdding("PhysicalAsset")}
                busy={busy}
              />
            </>
          ) : (
            <>
              <HoldingGroup
                title={CAPITAL_COPY.accounts}
                caption={CAPITAL_COPY.accountsNote}
                summaries={summaries(overview.accounts)}
                selected={selected}
                onSelect={(id) => setSelected(id === selected ? undefined : id)}
                onToggleIncluded={(id, included) => void include.run({ id, included })}
                addLabel={CAPITAL_COPY.addAccount}
                onAdd={() => setAdding("BankAccount")}
                busy={busy}
              />
              <HoldingGroup
                title={CAPITAL_COPY.assets}
                caption={CAPITAL_COPY.assetsNote}
                summaries={summaries(overview.assets)}
                selected={selected}
                onSelect={(id) => setSelected(id === selected ? undefined : id)}
                onToggleIncluded={(id, included) => void include.run({ id, included })}
                addLabel={CAPITAL_COPY.addAsset}
                onAdd={() => setAdding("PhysicalAsset")}
                busy={busy}
              />

              <CapitalTotalRow
                total={overview.total}
                goal={projection?.goal.targetAmount}
                excluded={all.filter((valued) => !countsTowardCapital(valued.holding)).length}
              />

              <p className="text-muted max-w-3xl text-xs">{CAPITAL_COPY.conventions}</p>
            </>
          )
        }
        detail={
          current === undefined ? null : (
            <HoldingDetailPanel
              summary={summarise(current, today())}
              history={historyOf(current.holding.id)}
              busy={busy}
              error={errorOf(record.state)}
              onRecord={(date, amountEuros) => {
                void record.run({
                  holding: current.holding,
                  date,
                  amountEuros: Number(amountEuros),
                  today: today(),
                  existing: undefined
                })
              }}
              onRemoveValuation={(snapshot) => void removeValuation.run(snapshot.id)}
              onDelete={() => setDeleting(current)}
            />
          )
        }
      />

      {adding === undefined ? null : (
        <HoldingForm
          key={adding}
          kind={adding}
          busy={busy}
          error={errorOf(add.state)}
          onSubmit={(state) => submit(adding, state)}
          onCancel={() => setAdding(undefined)}
        />
      )}

      <DeleteHoldingDialog
        name={deleting?.holding.name}
        valuations={deleting === undefined ? 0 : historyOf(deleting.holding.id).length}
        busy={busy}
        error={errorOf(remove.state)}
        onCancel={() => setDeleting(undefined)}
        onExcludeInstead={() => {
          if (deleting === undefined) return
          void include.run({ id: deleting.holding.id, included: false }).then((exit) => {
            if (Exit.isSuccess(exit)) setDeleting(undefined)
          })
        }}
        onConfirm={() => {
          if (deleting === undefined) return
          void remove.run(deleting.holding.id).then((exit) => {
            if (Exit.isSuccess(exit)) {
              setSelected(undefined)
              setDeleting(undefined)
            }
          })
        }}
      />
    </>
  )
}
