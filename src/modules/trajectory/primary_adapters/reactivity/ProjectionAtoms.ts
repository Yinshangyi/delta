/**
 * The live projection, for every screen that shows a target date.
 *
 * One atom rather than one per screen: the answer is the same everywhere, and
 * two screens computing it separately could disagree while a toggle was in
 * flight.
 */
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { projectionFrom } from "@/modules/trajectory/core/use_cases/ProjectionQuery"
import { thisMonth, today } from "@/shared/presentation/Today"

export const projectionAtom = appRuntime.atom(projectionFrom({ from: thisMonth(), asOf: today() }))
