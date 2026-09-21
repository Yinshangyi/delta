import { Badge } from "@/dsl/Badge"
import { AHEAD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type {
  CommitmentAhead,
  DebtAhead,
  TaxAhead
} from "@/modules/trajectory/primary_adapters/react/CommitmentsAhead"

export interface CommitmentsAheadPanelProps {
  readonly commitments: ReadonlyArray<CommitmentAhead>
}

/**
 * The commitments that end (TRJ-06, APP-06): a debt clears, a tax schedule
 * runs out. They are worth their own heading because they are the ones whose
 * shape changes the trajectory — the rent does not.
 *
 * An empty case rather than an absent section: a household with no debt should
 * read that as the good news it is, not as something that failed to load.
 */
export function CommitmentsAheadPanel({ commitments }: CommitmentsAheadPanelProps) {
  const copy = AHEAD_COPY

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-ink text-sm font-semibold">{copy.title}</h2>
        <p className="text-muted text-xs">{copy.note}</p>
      </div>

      {commitments.length === 0 ? (
        <div className="border-line bg-surface flex flex-col gap-1 rounded-lg border p-5">
          <p className="text-ink text-sm">{copy.empty}</p>
          <p className="text-muted text-xs">{copy.emptyNote}</p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {commitments.map((commitment) => (
            <li
              key={commitment.id}
              className="border-line bg-surface flex flex-col gap-3 rounded-lg border p-5"
            >
              {commitment.kind === "debt" ? (
                <DebtCard debt={commitment} />
              ) : (
                <TaxCard tax={commitment} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DebtCard({ debt }: { readonly debt: DebtAhead }) {
  const copy = AHEAD_COPY.debt

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-ink text-sm font-semibold">{debt.name}</p>
        <a href="#/commitments" className="text-muted hover:text-ink text-xs underline">
          {copy.record}
        </a>
      </div>

      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-ink text-2xl font-semibold tabular-nums">
          {MoneyText.money(debt.remaining)}
        </span>
        <span className="text-muted text-sm tabular-nums">
          {copy.remainingOf} {MoneyText.money(debt.initial)}
        </span>
      </p>

      <div
        className="bg-raised h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={debt.percentRepaid}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={copy.repaid}
      >
        <div className="bg-accent h-full" style={{ width: `${debt.percentRepaid}%` }} />
      </div>

      <div className="text-muted flex flex-wrap justify-between gap-2 text-xs">
        <span>
          {debt.percentRepaid}% {copy.repaid}
        </span>
        <span className="tabular-nums">
          {MoneyText.money(debt.monthly)} {copy.perMonth}
          {debt.monthsLeft === undefined
            ? ""
            : ` · ~${debt.monthsLeft} ${debt.monthsLeft === 1 ? copy.month : copy.months} ${copy.left}`}
        </span>
      </div>
    </>
  )
}

function TaxCard({ tax }: { readonly tax: TaxAhead }) {
  const copy = AHEAD_COPY.tax
  const estimated = tax.status === "estimated"

  return (
    <>
      {/*
          The liability's own name is the heading. A fixed "Next tax payment"
          gives two identical headings the moment a household has two tax
          liabilities, which is the ordinary case rather than the edge one.
      */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-ink text-sm font-semibold">{tax.name}</p>
        <Badge kind={estimated ? "estimated" : "confirmed"} />
      </div>

      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-ink text-2xl font-semibold tabular-nums">
          {tax.nextAmount === undefined
            ? copy.nothingDue
            : estimated
              ? MoneyText.estimated(tax.nextAmount)
              : MoneyText.money(tax.nextAmount)}
        </span>
        {tax.nextDate === undefined ? null : (
          <span className="text-muted text-sm">
            {copy.due} {DateText.day(tax.nextDate)}
          </span>
        )}
      </p>

      <p className="text-muted text-xs">
        {copy.title}
        {tax.payment === undefined
          ? ""
          : ` · ${copy.payment} ${tax.payment} ${copy.of} ${tax.payments}`}{" "}
        · {MoneyText.money(tax.stillScheduled)} {copy.of} {MoneyText.money(tax.total)}{" "}
        {copy.stillScheduled}
      </p>

      <p>
        <a href="#/commitments" className="text-muted hover:text-ink text-xs underline">
          {copy.schedule}
        </a>
      </p>
    </>
  )
}
