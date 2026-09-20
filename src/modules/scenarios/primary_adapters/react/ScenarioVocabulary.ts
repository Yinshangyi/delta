/** Copy as data, and one sentence per failure a scenario screen can meet. */
import { Match } from "effect"

import type { AppLayerError } from "@/bootstrap/runtime/AppLayer"
import type { InvalidCommitment } from "@/modules/commitments/core/use_cases/CommitmentFromDraft"
import type { InvalidLocalDate } from "@/shared/domain/LocalDate"
import type { InvalidMoney } from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export type ScenarioFailure =
  | AppLayerError
  | InvalidMoney
  | InvalidLocalDate
  | InvalidCommitment
  | PersistenceError

export const DEFECT_MESSAGE = "Something went wrong. Reloading usually clears this."

export const messageFor = (failure: ScenarioFailure): string =>
  Match.valueTags(failure, {
    InvalidMoney: () => "That is not an amount Delta can record.",
    InvalidLocalDate: () => "That is not a date Delta can read.",
    InvalidPercentage: () => "A rate has to be between 0 and 100%.",
    InvalidPeriod: () => "The end date is before the start date.",
    PersistenceError: () => "Could not save that. Your other data is unaffected.",
    SqlError: () => "Could not reach your data. Reloading usually clears this.",
    MigrationError: () => "Delta could not prepare its database on this device."
  })

export const CHANGE_LABELS = {
  ChangeDailyRate: "Change a daily rate",
  ChangeBillableDays: "Change billable days",
  ChangePayoutRatio: "Change a payout ratio",
  ChangeIncome: "Change a salary",
  AddHypotheticalExpense: "Add a purchase",
  DisableCommitment: "Drop a commitment",
  ExcludeHolding: "Stop counting a holding",
  ChangeHoldingValue: "Change what something is worth"
} as const

export const SCENARIOS_COPY = {
  title: "Scenarios",
  description: "Try a change before you make it, and see what it costs in months.",
  /** SCN-06: unmistakable throughout that none of this is real. */
  hypothetical: "Hypothetical",
  hypotheticalNote: "Nothing here has changed your plan.",
  builder: {
    title: "What if…",
    name: "Call it",
    namePlaceholder: "What if the rate rose",
    changes: "Changes",
    noChanges: "No changes yet",
    noChangesNote: "Add one below and Delta will tell you what it costs.",
    add: "Add a change",
    remove: "Remove",
    current: "As things are",
    simulation: "With these changes",
    targetDate: "Reaches the goal",
    monthsRemaining: "months away",
    noTarget: "Never, on this trajectory",
    impact: "Impact",
    sooner: "sooner",
    later: "later",
    unchanged: "No change to the target date",
    unknown: "No comparison — one side never reaches the goal",
    breakdown: "Where that comes from",
    discard: "Discard",
    preview: "Preview",
    apply: "Apply for real",
    save: "Keep this scenario"
  },
  list: {
    empty: "No scenarios yet",
    emptyNote:
      "A scenario is a question: what if the rate rose, what if we bought the thing, what if we dropped a subscription. Delta answers in months.",
    baseline: "As things are, you reach the goal in",
    newScenario: "New scenario",
    delete: "Delete",
    broken: "Needs attention"
  },
  apply: {
    title: "Apply these changes for real?",
    note: "Each of these becomes an ordinary edit to your plan. This is the only step that changes anything.",
    confirm: "Apply for real",
    cancel: "Cancel"
  },
  preview: {
    banner: "Previewing a scenario",
    note: "Nothing you see is your real plan.",
    exit: "Back to the real plan"
  },
  /** SCN-10: named, never silently dropped. */
  broken: {
    title: "This scenario points at something that no longer exists",
    note: "Delta will not guess what you meant, so it shows no impact until you fix it. Remove the change, or point it at something else.",
    missing: "refers to a",
    thatIsGone: "that has been deleted"
  }
} as const
