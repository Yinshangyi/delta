import { Button } from "@/dsl/Button"
import { HypotheticalMark } from "@/modules/scenarios/primary_adapters/react/components/HypotheticalMark"
import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"

export interface PreviewBannerProps {
  readonly name: string
  readonly onExit: () => void
}

/**
 * Persistent while previewing (SCN-09), across every screen, with the exit
 * always in it. Preview is a state someone can walk away from and come back
 * to, so it has to announce itself rather than be remembered.
 */
export function PreviewBanner({ name, onExit }: PreviewBannerProps) {
  const copy = SCENARIOS_COPY.preview

  return (
    <div className="border-line bg-raised flex flex-wrap items-center justify-between gap-3 border-b border-dashed px-4 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <HypotheticalMark />
        <p className="text-ink text-sm font-medium">
          {copy.banner}: {name}
        </p>
        <p className="text-muted text-xs">{copy.note}</p>
      </div>
      <Button onClick={onExit}>{copy.exit}</Button>
    </div>
  )
}
