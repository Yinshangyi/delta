/**
 * What one holding reads like in a list, as data rather than JSX.
 *
 * An asset's value carries `~` and the estimated treatment throughout
 * (spec §70, CAP-08): a resale guess must never be rendered with the same
 * authority as a bank balance.
 */
import { Match } from "effect"

import { countsTowardCapital } from "@/modules/capital/core/domain/Holding"
import { isStale } from "@/modules/capital/core/domain/Valuation"
import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"

export interface HoldingSummary {
  readonly id: HoldingId
  readonly name: string
  readonly subtitle: string | undefined
  readonly value: string
  readonly asOf: string | undefined
  readonly estimated: boolean
  readonly stale: boolean
  /** How old the valuation is, so a stale badge can say how stale (APP-07). */
  readonly ageInMonths: number | undefined
  readonly included: boolean
  readonly counted: boolean
}

export const summarise = (valued: ValuedHolding, on: LocalDate.LocalDate): HoldingSummary => {
  const { holding, valuation } = valued
  const estimated = valuation?.basis === "estimated"

  return {
    id: holding.id,
    name: holding.name,
    subtitle: Match.valueTags(holding, {
      BankAccount: (account) => account.institution,
      PhysicalAsset: (asset) => asset.category
    }),
    value:
      valuation === undefined
        ? CAPITAL_COPY.noValue
        : estimated
          ? MoneyText.estimated(valuation.amount)
          : MoneyText.money(valuation.amount),
    asOf:
      valuation === undefined ? undefined : `${CAPITAL_COPY.asOf} ${DateText.day(valuation.asOf)}`,
    estimated,
    stale: valuation !== undefined && isStale(valuation, on),
    ageInMonths:
      valuation === undefined
        ? undefined
        : YearMonth.monthsBetween(LocalDate.toYearMonth(valuation.asOf), LocalDate.toYearMonth(on)),
    included: holding.includedInCapital,
    counted: countsTowardCapital(holding)
  }
}
