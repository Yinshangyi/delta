/**
 * Which scenario, if any, the app is currently rendering under (SCN-09).
 *
 * An ordinary in-memory atom, deliberately: preview must not survive a reload.
 * Persisting it would mean a household could close the app inside a
 * simulation and open it believing the figures were theirs — the one mistake
 * this feature has to make impossible.
 */
import { Atom } from "effect/unstable/reactivity"

import type { Scenario } from "@/modules/scenarios/core/domain/Scenario"

export const previewAtom = Atom.make<Scenario | undefined>(undefined)
