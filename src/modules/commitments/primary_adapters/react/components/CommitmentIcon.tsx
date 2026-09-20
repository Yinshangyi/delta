import type { CommitmentKind } from "@/modules/commitments/core/domain/Commitment"

/**
 * One mark per kind (CMT-11), drawn rather than lettered: initials derived
 * from a name change when the name does, and two commitments called "Rent" and
 * "Repayment" would carry the same one.
 *
 * Each is `aria-hidden` — the kind is already named in words beside it, and a
 * second announcement of it would be noise to a screen reader.
 */
const PATHS: Record<CommitmentKind, string> = {
  // A repeating cycle.
  RecurringExpense: "M3 8a5 5 0 0 1 8.5-3.5L13 6M13 8a5 5 0 0 1-8.5 3.5L3 10M13 3v3h-3M3 13v-3h3",
  // A price tag.
  OneOffExpense: "M2 2h5l7 7-5 5-7-7V2Zm2.5 2.5h.01",
  // A card.
  Debt: "M1.5 4.5h13v7h-13v-7Zm0 2.5h13M3.5 9.5h3",
  // A document with lines.
  TaxLiability: "M4 1.5h5l3 3v10H4v-13Zm5 0v3h3M6 8h4M6 10.5h4",
  // A calendar with a repeat mark.
  RecurringTaxPayment: "M2.5 3.5h11v11h-11v-11Zm0 3h11M5 1.5v3M11 1.5v3M6 10.5h4l-1.5-1.5"
}

export interface CommitmentIconProps {
  readonly kind: CommitmentKind
}

export function CommitmentIcon({ kind }: CommitmentIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-muted shrink-0"
    >
      <path d={PATHS[kind]} />
    </svg>
  )
}
