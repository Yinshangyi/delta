import { useAtom } from "@effect/atom-react"

import { HouseholdGate } from "@/modules/household/primary_adapters/react/HouseholdGate"
import { PreviewBanner } from "@/modules/scenarios/primary_adapters/react/components/PreviewBanner"
import { previewAtom } from "@/modules/scenarios/primary_adapters/reactivity/PreviewAtom"
import { AppShellContainer } from "@/shell/AppShellContainer"

/**
 * The preview banner is here rather than on any one screen: previewing is a
 * state of the whole app, and one someone can walk away from (SCN-09). It
 * lives in an in-memory atom, so a reload always returns to the real plan.
 */
export function App() {
  const [preview, setPreview] = useAtom(previewAtom)

  return (
    <HouseholdGate>
      {preview === undefined ? null : (
        <PreviewBanner name={preview.name} onExit={() => setPreview(undefined)} />
      )}
      <AppShellContainer />
    </HouseholdGate>
  )
}
