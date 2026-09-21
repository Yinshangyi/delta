/** Copy as data, and one sentence per failure a trajectory screen can meet. */
import { Match } from "effect"

import type { AppLayerError } from "@/bootstrap/runtime/AppLayer"
import type { ValuationInTheFuture } from "@/modules/capital/core/domain/ValuationDate"
import type { InvalidLocalDate } from "@/shared/domain/LocalDate"
import type { InvalidMoney } from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export type TrajectoryFailure =
  | AppLayerError
  | InvalidMoney
  | InvalidLocalDate
  | ValuationInTheFuture
  | PersistenceError

export const DEFECT_MESSAGE = "Something went wrong. Reloading usually clears this."

export const messageFor = (failure: TrajectoryFailure): string =>
  Match.valueTags(failure, {
    InvalidMoney: () => "That is not an amount Delta can record.",
    InvalidLocalDate: () => "That is not a date Delta can read.",
    ValuationInTheFuture: () => "That date has not happened yet. Record what is there today.",
    PersistenceError: () => "Could not save that. Your other data is unaffected.",
    SqlError: () => "Could not reach your data. Reloading usually clears this.",
    MigrationError: () => "Delta could not prepare its database on this device."
  })

/** APP-06: the commitments that end, as cards. */
export const AHEAD_COPY = {
  title: "Debts and scheduled payments",
  note: "Commitments that end, rather than repeat forever",
  empty: "No debts or scheduled tax.",
  emptyNote: "Nothing with a finish line of its own.",
  debt: {
    remainingOf: "remaining of",
    repaid: "repaid",
    perMonth: "/ month",
    month: "month",
    months: "months",
    left: "left",
    record: "Record actual balance"
  },
  tax: {
    title: "Next tax payment",
    /* Used as the detail line now the heading is the liability's own name. */
    due: "due",
    payment: "payment",
    of: "of",
    stillScheduled: "still scheduled.",
    nothingDue: "Nothing due",
    schedule: "See schedule"
  }
} as const

/** APP-05: the chart names its own lines. */
export const CHART_COPY = {
  actual: "Actual",
  forecast: "Forecast",
  goal: "Goal",
  today: "TODAY"
} as const

export const DASHBOARD_COPY = {
  title: "Dashboard",
  onTrackFor: "On track for",
  /** Spec §37: never presented as a promise. */
  estimate: "An estimate, on today's figures.",
  reached: "of the goal reached",
  capital: "Capital",
  goal: "Goal",
  netWorth: "Net worth",
  netWorthNote: "Capital less what is still owed.",
  trajectory: {
    title: "Where the money goes",
    income: "Income a month",
    commitments: "Commitments a month",
    savings: "Left over a month",
    typicalNote: "What most months look like.",
    /** TRJ-06: excluding scheduled tax without saying so overstates the rate. */
    lumpyNote:
      "Averaged over the next year, including scheduled payments such as tax, it is closer to",
    steadyNote: "Nothing lumpy in the next year — every month looks much like this one."
  },
  unreachable: {
    title: "Not reachable on the current trajectory",
    shortfall: "The household is putting aside about",
    shortfallNegative: "The household is losing about",
    aMonth: "a month",
    never: "so the goal is never reached.",
    horizon: "so the goal is not reached within fifty years.",
    suggestion: "Try a scenario to see what would change it.",
    noGoal: "No goal set yet",
    noGoalNote: "Set one in Settings and Delta can tell you when you get there."
  },
  variance: {
    title: "Against plan",
    ahead: "ahead of the forecast",
    behind: "behind the forecast",
    onPlan: "exactly on the forecast",
    expected: "Forecast",
    actual: "Recorded",
    moved: "The target date moved",
    movedSooner: "sooner",
    movedLater: "later",
    unchanged: "The target date did not move.",
    none: "Nothing to compare against yet",
    /** TRJ-10: not zero, which would read as being exactly on plan. */
    noneNote:
      "Record balances a second time and Delta can tell you whether you are ahead or behind."
  },
  commitmentsAhead: {
    title: "Commitments with an end in sight",
    empty: "No debts or scheduled tax.",
    emptyNote: "Nothing with a finish line of its own."
  },
  updateBalances: "Update balances",
  everyMonth: "See every month",
  /** APP-03: the mock's header line, and the one place the premise is stated unprompted. */
  header: {
    updated: "Updated",
    neverUpdated: "No balances recorded yet",
    privacy: "nothing leaves this machine"
  },
  target: {
    eyebrow: "Estimated target",
    remaining: "months remaining",
    thisMonth: "reached this month",
    basis: "Estimate · based on your current trajectory",
    onPlan: "on plan",
    ahead: "ahead",
    behind: "behind"
  },
  capitalCard: {
    eyebrow: "Total capital",
    of: "of",
    accounts: "accounts",
    account: "account",
    assets: "assets",
    asset: "asset",
    reached: "reached",
    capitalScreen: "Capital"
  },
  band: {
    income: "Household income",
    commitments: "Commitments",
    savings: "Expected monthly savings",
    perMonth: "/ month",
    active: "active · tax scheduled separately",
    lessCommitments: "Income less commitments"
  },
  chartLabel: "Savings against the goal, month by month"
} as const

/**
 * The Projection screen is the dashboard's chart at full size with the
 * month-by-month table under it (design-brief.md, "Projection chart"). It
 * carries no primary action of its own — principle 4 puts the one action on
 * the dashboard, and this screen is for reading.
 */
export const PROJECTION_COPY = {
  title: "Projection",
  subtitle: "Every month between here and the goal",
  chartLabel: DASHBOARD_COPY.chartLabel,
  tableTitle: "Month by month",
  noGoal: DASHBOARD_COPY.unreachable.noGoal,
  noGoalNote: DASHBOARD_COPY.unreachable.noGoalNote
} as const
