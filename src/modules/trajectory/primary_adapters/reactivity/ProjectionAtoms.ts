/**
 * The live projection, for every screen that shows a target date.
 *
 * It runs through the scenario port rather than `projectionFrom` directly, so
 * that previewing changes what the whole app shows without a second projection
 * atom that could disagree with this one (SCN-09). With nothing being
 * previewed the overrides are empty, which is the baseline — the same code
 * path, not a special case.
 *
 * This reaches sideways to a scenarios port from a trajectory adapter. The
 * alternative was two projection atoms and a rule about which screens read
 * which, and two answers to one question is the thing worth avoiding.
 */
import { Effect } from "effect"

import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { ScenarioProjections } from "@/modules/scenarios/core/ports/secondary/ScenarioProjections"
import { previewAtom } from "@/modules/scenarios/primary_adapters/reactivity/PreviewAtom"

export const projectionAtom = appRuntime.atom((get) => {
  const preview = get(previewAtom)

  return Effect.gen(function* () {
    const projections = yield* ScenarioProjections
    return yield* projections.under(preview === undefined ? [] : preview.overrides)
  })
})
