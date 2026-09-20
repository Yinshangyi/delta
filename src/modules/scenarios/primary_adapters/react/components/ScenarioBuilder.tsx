import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import {
  AddChangeForm,
  type ChangeDraft,
  type Choosable
} from "@/modules/scenarios/primary_adapters/react/components/AddChangeForm"
import { BrokenScenarioNotice } from "@/modules/scenarios/primary_adapters/react/components/BrokenScenarioNotice"
import { ChangeStack } from "@/modules/scenarios/primary_adapters/react/components/ChangeStack"
import { ComparisonPanel } from "@/modules/scenarios/primary_adapters/react/components/ComparisonPanel"
import { HypotheticalMark } from "@/modules/scenarios/primary_adapters/react/components/HypotheticalMark"
import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"

import type { BrokenReference } from "@/modules/scenarios/core/domain/BrokenReferences"
import type { OverrideId } from "@/modules/scenarios/core/domain/Scenario"
import type { TimeCost } from "@/modules/scenarios/core/domain/TimeCost"
import type { ChangeSummary } from "@/modules/scenarios/primary_adapters/react/ChangeSummary"

export interface ScenarioBuilderProps {
  readonly name: string
  readonly onRename: (name: string) => void
  readonly changes: ReadonlyArray<ChangeSummary>
  readonly broken: ReadonlyArray<BrokenReference>
  readonly cost: TimeCost | undefined
  readonly incomeSources: ReadonlyArray<Choosable>
  readonly commitments: ReadonlyArray<Choosable>
  readonly holdings: ReadonlyArray<Choosable>
  readonly onAdd: (draft: ChangeDraft) => void
  readonly onRemove: (id: OverrideId) => void
  readonly onDiscard: () => void
  readonly onPreview: () => void
  readonly onApply: () => void
  readonly onSave: () => void
  readonly busy: boolean
}

/**
 * The builder (SCN-06). Three exits — discard, preview, apply — plus keeping
 * the question for later, and the hypothetical marking on every part of it.
 *
 * The comparison is withheld while a reference is broken: showing a delta
 * computed from a change that points at nothing would be worse than showing
 * none at all.
 */
export function ScenarioBuilder(props: ScenarioBuilderProps) {
  const copy = SCENARIOS_COPY.builder
  const isBroken = props.broken.length > 0

  return (
    <section className="border-line flex flex-col gap-5 rounded-lg border border-dashed p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-ink text-lg font-semibold tracking-tight">{copy.title}</h2>
          <HypotheticalMark />
        </div>
        <p className="text-muted text-xs">{SCENARIOS_COPY.hypotheticalNote}</p>
      </header>

      <Field label={copy.name}>
        {(ids) => (
          <TextInput
            {...ids}
            value={props.name}
            autoComplete="off"
            placeholder={copy.namePlaceholder}
            onChange={(event) => props.onRename(event.target.value)}
          />
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <h3 className="text-ink text-sm font-semibold">{copy.changes}</h3>
        <ChangeStack
          changes={props.changes}
          brokenIds={props.broken.map((each) => each.override)}
          onRemove={props.onRemove}
          busy={props.busy}
        />
      </div>

      <AddChangeForm
        incomeSources={props.incomeSources}
        commitments={props.commitments}
        holdings={props.holdings}
        onAdd={props.onAdd}
        busy={props.busy}
      />

      <BrokenScenarioNotice broken={props.broken} />

      {isBroken || props.cost === undefined ? null : (
        <ComparisonPanel cost={props.cost} changes={props.changes} />
      )}

      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button tone="ghost" disabled={props.busy} onClick={props.onDiscard}>
          {copy.discard}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button disabled={props.busy || props.changes.length === 0} onClick={props.onSave}>
            {copy.save}
          </Button>
          <Button
            disabled={props.busy || isBroken || props.changes.length === 0}
            onClick={props.onPreview}
          >
            {copy.preview}
          </Button>
          <Button
            tone="primary"
            disabled={props.busy || isBroken || props.changes.length === 0}
            onClick={props.onApply}
          >
            {copy.apply}
          </Button>
        </div>
      </div>
    </section>
  )
}
