import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import * as Money from "@/shared/domain/Money"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type * as YearMonth from "@/shared/domain/YearMonth"

export interface CapitalHeadlineProps {
  readonly total: Money.Money
  readonly goal: Money.Money | undefined
  /** Absent where nothing is owed — there is then nothing to say (CAP-11). */
  readonly netWorth: Money.Money | undefined
  readonly targetDate: YearMonth.YearMonth | undefined
  readonly hasGoal: boolean
  readonly accounts: number
  readonly assets: number
  readonly excluded: number
}

const percentOf = (total: Money.Money, goal: Money.Money | undefined): number | undefined =>
  goal === undefined || !Money.isPositive(goal)
    ? undefined
    : Math.min(100, Math.round((Money.toCents(total) / Money.toCents(goal)) * 100))

/**
 * Capital is the headline because capital is what drives the target date
 * (spec §77). Net worth sits beneath it, and only where debts exist — a line
 * reading "net worth: the same number" would be noise.
 *
 * The target date is here rather than a page away because this is the screen
 * where it is being interrogated: every inclusion toggle below is a question
 * about it, and an answer you have to navigate to is not an answer (CAP-07).
 * It is marked LIVE for the same reason — it moves while you toggle.
 */
export function CapitalHeadline(props: CapitalHeadlineProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TotalCard {...props} />
      <TargetCard {...props} />
    </div>
  )
}

function TotalCard({ total, goal, netWorth, accounts, assets }: CapitalHeadlineProps) {
  const copy = CAPITAL_COPY
  const percent = percentOf(total, goal)

  return (
    <section className="border-line bg-surface flex flex-col gap-2 rounded-lg border p-5">
      <p className="eyebrow">{copy.total}</p>

      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-ink text-3xl font-semibold tracking-tight tabular-nums">
          {MoneyText.money(total)}
        </p>
        {goal === undefined ? null : (
          <p className="text-muted text-sm tabular-nums">
            {copy.of} {MoneyText.money(goal)}
          </p>
        )}
      </div>

      <p className="text-muted text-sm">
        {accounts} {accounts === 1 ? copy.account : copy.accountsLower} · {assets}{" "}
        {assets === 1 ? copy.asset : copy.assetsLower}
        {percent === undefined ? "" : ` · ${percent}% ${copy.reached}`}
      </p>

      {percent === undefined ? null : (
        <div
          className="bg-raised h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={copy.reached}
        >
          <div className="bg-accent h-full" style={{ width: `${percent}%` }} />
        </div>
      )}

      {netWorth === undefined ? null : (
        <div className="border-line mt-1 flex items-baseline justify-between gap-3 border-t pt-3">
          <p className="text-muted text-sm">{copy.netWorth}</p>
          <p className="text-ink text-sm font-medium tabular-nums">{MoneyText.money(netWorth)}</p>
        </div>
      )}
    </section>
  )
}

function TargetCard({ targetDate, hasGoal, excluded }: CapitalHeadlineProps) {
  const copy = CAPITAL_COPY

  return (
    <section className="border-line bg-surface flex flex-col gap-2 rounded-lg border p-5">
      <p className="eyebrow">
        {copy.targetDate} · {copy.live}
      </p>

      {!hasGoal ? (
        <p className="text-ink text-lg font-medium">{copy.noGoal}</p>
      ) : targetDate === undefined ? (
        <p className="text-ink text-lg font-medium">{copy.noTarget}</p>
      ) : (
        <p className="text-ink text-3xl font-semibold tracking-tight">
          {DateText.month(targetDate)}
        </p>
      )}

      {/*
          Says whether what is being counted is still the default set. Without
          it a target date computed from a pared-back set looks exactly like
          one computed from everything (CAP-07).
      */}
      <span className="border-line text-ink inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
        <span aria-hidden="true" className="bg-ink size-1.5 rounded-full" />
        {excluded === 0
          ? copy.defaultSet
          : `${excluded} ${excluded === 1 ? copy.oneExcluded : copy.manyExcluded}`}
      </span>
    </section>
  )
}
