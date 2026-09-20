import { useAtomValue } from "@effect/atom-react"
import { Exit, Match } from "effect"
import { useState } from "react"

import { FailureState } from "@/dsl/FailureState"
import { CommitmentsScreen } from "@/modules/commitments/primary_adapters/react/CommitmentsScreen"
import { summarise } from "@/modules/commitments/primary_adapters/react/CommitmentSummary"
import {
  DEFECT_MESSAGE,
  messageFor
} from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import { CommitmentDetailPanel } from "@/modules/commitments/primary_adapters/react/components/CommitmentDetailPanel"
import {
  type CommitmentFormState,
  draftFrom
} from "@/modules/commitments/primary_adapters/react/components/CommitmentDraftState"
import { CommitmentForm } from "@/modules/commitments/primary_adapters/react/components/CommitmentForm"
import { formStateFrom } from "@/modules/commitments/primary_adapters/react/components/CommitmentFormFrom"
import { CommitmentsList } from "@/modules/commitments/primary_adapters/react/components/CommitmentsList"
import { DebtBalanceForm } from "@/modules/commitments/primary_adapters/react/components/DebtBalanceForm"
import { DeleteCommitmentDialog } from "@/modules/commitments/primary_adapters/react/components/DeleteCommitmentDialog"
import {
  commitmentsOverviewAtom,
  debtHistoryAtom,
  deleteCommitmentAtom,
  recordDebtBalanceAtom,
  removeDebtBalanceAtom,
  saveCommitmentAtom,
  setCommitmentEnabledAtom
} from "@/modules/commitments/primary_adapters/reactivity/CommitmentAtoms"
import { useCommitmentMutation } from "@/modules/commitments/primary_adapters/reactivity/useCommitmentMutation"
import { type AsyncState, resolveStream } from "@/shared/reactivity/AsyncState"

import type { Commitment, CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { DebtSnapshot } from "@/modules/commitments/core/domain/DebtSnapshot"
import type { CommitmentsOverview } from "@/modules/commitments/core/use_cases/CommitmentsOverviewQuery"
import type { CommitmentFailure } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import type { HouseholdId } from "@/modules/household/core/domain/Household"

export interface CommitmentsContainerProps {
  readonly household: HouseholdId
}

const errorOf = (state: AsyncState<unknown, CommitmentFailure>): string | undefined =>
  Match.valueTags(state, {
    Idle: () => undefined,
    Loading: () => undefined,
    Success: () => undefined,
    Failure: ({ error }) => messageFor(error),
    Defect: () => DEFECT_MESSAGE
  })

const isBusy = (state: AsyncState<unknown, CommitmentFailure>): boolean =>
  Match.valueTags(state, {
    Idle: () => false,
    Loading: () => true,
    Success: () => false,
    Failure: () => false,
    Defect: () => false
  })

export function CommitmentsContainer({ household }: CommitmentsContainerProps) {
  const overview = resolveStream(useAtomValue(commitmentsOverviewAtom))
  const history = resolveStream(useAtomValue(debtHistoryAtom))

  return Match.valueTags(overview, {
    Idle: () => <p className="text-muted text-sm">Loading…</p>,
    Loading: () => <p className="text-muted text-sm">Loading…</p>,
    Failure: ({ error }) => (
      <FailureState title="Could not load your commitments." detail={messageFor(error)} />
    ),
    Defect: () => <FailureState title="Could not load your commitments." detail={DEFECT_MESSAGE} />,
    Success: ({ value }) => (
      <Commitments
        household={household}
        overview={value}
        history={Match.valueTags(history, {
          Idle: () => [],
          Loading: () => [],
          Success: ({ value: snapshots }) => snapshots,
          Failure: () => [],
          Defect: () => []
        })}
      />
    )
  })
}

interface CommitmentsProps {
  readonly household: HouseholdId
  readonly overview: CommitmentsOverview
  readonly history: ReadonlyArray<DebtSnapshot>
}

function Commitments({ household, overview, history }: CommitmentsProps) {
  const save = useCommitmentMutation(saveCommitmentAtom)
  const toggle = useCommitmentMutation(setCommitmentEnabledAtom)
  const remove = useCommitmentMutation(deleteCommitmentAtom)
  const record = useCommitmentMutation(recordDebtBalanceAtom)
  const removeBalance = useCommitmentMutation(removeDebtBalanceAtom)

  const [selected, setSelected] = useState<CommitmentId | undefined>(undefined)
  const [editing, setEditing] = useState<CommitmentFormState | undefined>(undefined)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Commitment | undefined>(undefined)

  const busy = [save, toggle, remove, record, removeBalance].some((mutation) =>
    isBusy(mutation.state)
  )
  const current = overview.commitments.find((commitment) => commitment.id === selected)
  const position = current === undefined ? undefined : overview.positions.get(current.id)

  const submit = async (state: CommitmentFormState): Promise<boolean> => {
    const exit = await save.run({ draft: draftFrom(household, state), existing: current?.id })
    if (!Exit.isSuccess(exit)) return false
    setAdding(false)
    setEditing(undefined)
    return true
  }

  const balances =
    current === undefined || position === undefined ? null : (
      <DebtBalanceForm
        busy={busy}
        error={errorOf(record.state)}
        history={history.filter((snapshot) => snapshot.debtId === current.id)}
        onRecord={(date, remainingEuros) => {
          void record.run({
            debt: current.id,
            date,
            remainingEuros: Number(remainingEuros),
            existing: undefined
          })
        }}
        onRemove={(snapshot) => void removeBalance.run(snapshot.id)}
      />
    )

  return (
    <>
      <CommitmentsScreen
        list={
          <CommitmentsList
            busy={busy}
            selected={selected}
            summaries={overview.commitments.map((commitment) =>
              summarise(commitment, overview.positions)
            )}
            onSelect={(id) => setSelected(id === selected ? undefined : id)}
            onToggle={(id, enabled) => void toggle.run({ id, enabled })}
            onAdd={() => setAdding(true)}
          />
        }
        detail={
          <CommitmentDetailPanel
            commitment={current}
            position={position}
            totals={overview.totals}
            busy={busy}
            balances={balances}
            onEdit={() => {
              if (current !== undefined) setEditing(formStateFrom(current))
            }}
            onDelete={() => setDeleting(current)}
          />
        }
      />

      {adding || editing !== undefined ? (
        <CommitmentForm
          key={editing === undefined ? "add" : `edit-${current?.id ?? ""}`}
          open
          initial={editing}
          busy={busy}
          error={errorOf(save.state)}
          onSubmit={submit}
          onCancel={() => {
            setAdding(false)
            setEditing(undefined)
          }}
        />
      ) : null}

      <DeleteCommitmentDialog
        name={deleting?.name}
        isDebt={deleting !== undefined && overview.positions.has(deleting.id)}
        busy={busy}
        error={errorOf(remove.state)}
        onCancel={() => setDeleting(undefined)}
        onDisableInstead={() => {
          if (deleting === undefined) return
          void toggle.run({ id: deleting.id, enabled: false }).then((exit) => {
            if (Exit.isSuccess(exit)) setDeleting(undefined)
          })
        }}
        onConfirm={() => {
          if (deleting === undefined) return
          void remove.run(deleting.id).then((exit) => {
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
