import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import * as Money from "@/shared/domain/Money"
import * as MoneyText from "@/shared/presentation/MoneyText"

export interface CapitalTotalRowProps {
  readonly total: Money.Money
  readonly goal: Money.Money | undefined
  readonly excluded: number
}

/**
 * Closes the list with the figure the toggles above add up to, and says how
 * many are being left out (APP-07).
 *
 * The count is the point. A total with nothing beside it cannot be told apart
 * from a total of everything, and the difference is the question this screen
 * exists to ask.
 */
export function CapitalTotalRow({ total, goal, excluded }: CapitalTotalRowProps) {
  const copy = CAPITAL_COPY
  const percent =
    goal === undefined || !Money.isPositive(goal)
      ? undefined
      : Math.min(100, Math.round((Money.toCents(total) / Money.toCents(goal)) * 100))

  return (
    <div className="border-line bg-raised flex flex-wrap items-baseline justify-between gap-3 rounded-lg border px-4 py-3">
      <p className="flex flex-wrap items-baseline gap-3">
        <span className="eyebrow">{copy.totalRow}</span>
        <span className="text-ink text-lg font-semibold tabular-nums">
          {MoneyText.money(total)}
        </span>
        {goal === undefined ? null : (
          <span className="text-muted text-sm tabular-nums">
            {copy.of} {MoneyText.money(goal)}
            {percent === undefined ? "" : ` · ${percent}%`}
          </span>
        )}
      </p>

      <p className="text-muted text-xs">
        {excluded === 0
          ? copy.defaultSet
          : `${excluded} ${excluded === 1 ? copy.oneExcluded : copy.manyExcluded}`}
      </p>
    </div>
  )
}
