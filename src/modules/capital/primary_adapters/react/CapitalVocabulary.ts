/** Copy as data, and one sentence per failure a capital screen can be handed. */
import { Match } from "effect"

import type { AppLayerError } from "@/bootstrap/runtime/AppLayer"
import type { ValuationInTheFuture } from "@/modules/capital/core/domain/ValuationDate"
import type { InvalidHolding } from "@/modules/capital/core/use_cases/AddHoldingUseCase"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export type CapitalFailure =
  | AppLayerError
  | InvalidHolding
  | ValuationInTheFuture
  | PersistenceError

export const DEFECT_MESSAGE = "Something went wrong. Reloading usually clears this."

export const messageFor = (failure: CapitalFailure): string =>
  Match.valueTags(failure, {
    InvalidMoney: () => "That is not an amount Delta can record.",
    InvalidLocalDate: () => "That is not a date Delta can read.",
    ValuationInTheFuture: () => "That date has not happened yet. Record what is there today.",
    PersistenceError: () => "Could not save that. Your other data is unaffected.",
    SqlError: () => "Could not reach your data. Reloading usually clears this.",
    MigrationError: () => "Delta could not prepare its database on this device."
  })

export const CAPITAL_COPY = {
  title: "Capital",
  description: "Everything you own that counts toward the goal.",
  total: "Capital toward goal",
  /** Spec §77: the headline is capital, because capital drives the target date. */
  totalNote: "The projection's starting balance.",
  netWorth: "Net worth",
  netWorthNote: "Capital less what is still owed.",
  targetDate: "On track for",
  noTarget: "Not reachable on this trajectory",
  noGoal: "No goal set yet",
  of: "of",
  reached: "reached",
  account: "account",
  accountsLower: "accounts",
  asset: "asset",
  assetsLower: "assets",
  live: "Live",
  defaultSet: "unchanged from your default set",
  oneExcluded: "holding excluded",
  manyExcluded: "holdings excluded",
  accountsNote: "Balances you can verify",
  assetsNote: "Estimated resale — never the authority of a balance",
  includedColumn: "Included",
  totalRow: "Total capital",
  conventions:
    "Excluded holdings stay in the list, struck through and muted — nothing is deleted. Asset values carry ~, a dashed badge and their valuation date; a valuation older than a year is marked stale.",
  staleFor: "stale",
  monthsShort: "mo",
  accounts: "Accounts",
  assets: "Assets",
  addAccount: "Add account",
  addAsset: "Add asset",
  empty: "Nothing recorded yet",
  emptyDescription:
    "Capital is everything that counts toward the goal: bank accounts, and things you own at what they would actually sell for.",
  noValue: "No value recorded",
  included: "Counted",
  excluded: "Not counted",
  excludedNote: "Still here, and still worth what it is worth. It just is not being counted.",
  stale: "Valued over a year ago",
  asOf: "as of",
  history: "Valuation history",
  noHistory: "Nothing recorded yet.",
  removeValuation: "Remove",
  /** Spec §78: the value is what would actually arrive, not a listing price. */
  resaleHint:
    "What you would actually receive after fees and negotiation — not the listing price, and not what it cost.",
  acquisitionHint: "Recorded for reference. It never enters capital or the projection.",
  record: {
    title: "Record a value",
    date: "As of",
    amount: "Value (€)",
    save: "Record",
    previous: "Currently"
  },
  remove: {
    action: "Delete",
    title: "Delete this holding?",
    warning: "It is gone for good, along with every value you have recorded for it.",
    alternative: "Leaving it out of capital instead keeps the record and can be undone.",
    excludeInstead: "Leave out of capital instead",
    confirm: "Delete for good",
    cancel: "Cancel"
  }
} as const
