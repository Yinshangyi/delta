/** Copy as data, and one sentence per failure the goal screen can be handed. */
import { Match } from "effect"

import type { AppLayerError } from "@/bootstrap/runtime/AppLayer"
import type { InvalidGoal } from "@/modules/trajectory/core/domain/FinancialGoal"
import type { InvalidMoney } from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export type GoalFailure = AppLayerError | InvalidGoal | InvalidMoney | PersistenceError

export const DEFECT_MESSAGE = "Something went wrong. Reloading usually clears this."

export const messageFor = (failure: GoalFailure): string =>
  Match.valueTags(failure, {
    InvalidGoal: (error) =>
      error.reason === "unnamed"
        ? "Give the goal a name."
        : "A target has to be more than nothing.",
    InvalidMoney: () => "That is not an amount Delta can record.",
    PersistenceError: () => "Could not save that. Your other data is unaffected.",
    SqlError: () => "Could not reach your data. Reloading usually clears this.",
    MigrationError: () => "Delta could not prepare its database on this device."
  })

export const GOAL_COPY = {
  title: "Goal",
  description: "The amount the projection runs toward.",
  nameLabel: "Goal name",
  nameHint: "Whatever you call it between yourselves.",
  targetLabel: "Target amount (€)",
  save: "Save goal",
  enabledLabel: "Projecting toward this goal",
  /** Spec §32: a switched-off goal is kept, not deleted. */
  disabledNote: "Kept, but nothing is being projected toward it.",
  none: "No goal yet",
  noneDescription:
    "Delta needs something to count toward before it can tell you when you get there."
} as const
