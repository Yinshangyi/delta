/**
 * The single bridge between React and Effect.
 *
 * Components never run an Effect, never see a Layer and never touch the
 * runtime — they read atoms built from this. That is what keeps a component
 * testable by rendering it with props, and what makes the whole runtime
 * swappable in one line.
 */
import { Atom } from "effect/unstable/reactivity"

import { AppLayerLive } from "@/bootstrap/runtime/AppLayer"

export const appRuntime = Atom.runtime(AppLayerLive)
