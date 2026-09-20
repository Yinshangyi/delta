import { Button } from "@/dsl/Button"
import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"

import type { OverrideId } from "@/modules/scenarios/core/domain/Scenario"
import type { ChangeSummary } from "@/modules/scenarios/primary_adapters/react/ChangeSummary"

export interface ChangeStackProps {
  readonly changes: ReadonlyArray<ChangeSummary>
  readonly brokenIds: ReadonlyArray<OverrideId>
  readonly onRemove: (id: OverrideId) => void
  readonly busy: boolean
}

/** The stack, in the order the household is considering it. */
export function ChangeStack({ changes, brokenIds, onRemove, busy }: ChangeStackProps) {
  const copy = SCENARIOS_COPY.builder

  if (changes.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-ink text-sm">{copy.noChanges}</p>
        <p className="text-muted text-xs">{copy.noChangesNote}</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {changes.map((change) => {
        const broken = brokenIds.includes(change.id)
        return (
          <li
            key={change.id}
            className="border-line flex items-start justify-between gap-3 rounded-md border border-dashed px-3 py-2"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted text-xs">{change.label}</span>
              <span className={`text-sm ${broken ? "text-muted line-through" : "text-ink"}`}>
                {change.detail}
              </span>
              {broken ? (
                <span className="text-negative text-xs">{SCENARIOS_COPY.list.broken}</span>
              ) : null}
            </span>
            <Button tone="ghost" disabled={busy} onClick={() => onRemove(change.id)}>
              {copy.remove}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
