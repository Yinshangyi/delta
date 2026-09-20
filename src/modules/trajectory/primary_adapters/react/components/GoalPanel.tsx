import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { Switch } from "@/dsl/Switch"
import { GOAL_COPY } from "@/modules/trajectory/primary_adapters/react/GoalVocabulary"

export interface GoalPanelProps {
  readonly name: string
  readonly targetEuros: string
  readonly enabled: boolean | undefined
  readonly onSave: (name: string, targetEuros: string) => void
  readonly onToggle: (enabled: boolean) => void
  readonly busy: boolean
  readonly error: string | undefined
}

/**
 * One goal on screen, which is what V1 shows (spec §14) even though the model
 * holds several. The switch is absent until there is a goal to switch — a
 * control for something that does not exist yet would be the emptiest kind of
 * placeholder.
 */
export function GoalPanel({
  name,
  targetEuros,
  enabled,
  onSave,
  onToggle,
  busy,
  error
}: GoalPanelProps) {
  const [draftName, setDraftName] = useState(name)
  const [draftTarget, setDraftTarget] = useState(targetEuros)
  const ready = draftName.trim() !== "" && draftTarget !== ""

  return (
    <div className="flex flex-col gap-4">
      {enabled === undefined ? (
        <p className="text-muted text-sm">{GOAL_COPY.noneDescription}</p>
      ) : (
        <div className="flex flex-col gap-1">
          <Switch
            checked={enabled}
            onChange={onToggle}
            label={GOAL_COPY.enabledLabel}
            disabled={busy}
          />
          {enabled ? null : <p className="text-muted text-xs">{GOAL_COPY.disabledNote}</p>}
        </div>
      )}

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(draftName, draftTarget)
        }}
      >
        <Field label={GOAL_COPY.nameLabel} hint={GOAL_COPY.nameHint}>
          {(ids) => (
            <TextInput
              {...ids}
              value={draftName}
              autoComplete="off"
              onChange={(event) => setDraftName(event.target.value)}
            />
          )}
        </Field>

        <Field label={GOAL_COPY.targetLabel} {...(error === undefined ? {} : { error })}>
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              value={draftTarget}
              invalid={error !== undefined}
              onChange={(event) => setDraftTarget(event.target.value)}
            />
          )}
        </Field>

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={!ready || busy}>
            {GOAL_COPY.save}
          </Button>
        </div>
      </form>
    </div>
  )
}
