/**
 * What one income source reads like on screen, as data rather than JSX.
 *
 * Currency and date formatting stay out of components (architecture.md —
 * React), which is also what makes the §10 estimate labelling testable: a
 * freelance line is `estimate: true` by construction, not by a reviewer
 * noticing the badge.
 */
import { Match } from "effect"

import * as IncomeSource from "@/modules/household/core/domain/IncomeSource"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as Percentage from "@/shared/domain/Percentage"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

export interface IncomeSummary {
  readonly kind: string
  readonly name: string
  readonly headline: string
  readonly details: ReadonlyArray<string>
  /** §10: a freelance figure is an estimate, and the UI must say so. */
  readonly estimate: boolean
  readonly period: string
  readonly enabled: boolean
}

const copy = HOUSEHOLD_COPY.income

const periodOf = (period: IncomeSource.ActivePeriod): string =>
  period.endDate === undefined
    ? `${DateText.day(period.startDate)} — ${copy.openEnded}`
    : `${DateText.day(period.startDate)} — ${DateText.day(period.endDate)}`

const freelanceSummary = (source: IncomeSource.FreelanceIncome): IncomeSummary => ({
  kind: copy.freelance,
  name: source.name,
  headline: `${MoneyText.money(DailyRate.toMoney(source.dailyRate))} ${copy.perDay}`,
  details: [
    `${Percentage.toPercent(PayoutRatio.toPercentage(source.estimatedPayoutRatio))}% ${copy.payoutRatio}`,
    `${BillableDays.toNumber(source.billableDays.standard)} ${copy.standardDays}`
  ],
  estimate: true,
  period: periodOf(source.period),
  enabled: source.enabled
})

const salarySummary = (source: IncomeSource.SalaryIncome): IncomeSummary => ({
  kind: copy.salary,
  name: source.name,
  headline: `${MoneyText.money(Money.subtract(source.monthlyNetBeforeTax, source.monthlyIncomeTax))} ${copy.netAfterTax}`,
  details: [
    `${MoneyText.money(source.monthlyNetBeforeTax)} ${copy.netBeforeTax}`,
    `${MoneyText.money(source.monthlyIncomeTax)} ${copy.incomeTax}`,
    ...(source.annualGross === undefined
      ? []
      : [`${MoneyText.money(source.annualGross)} ${copy.annualGross}`])
  ],
  estimate: false,
  period: periodOf(source.period),
  enabled: source.enabled
})

export const summarise = (source: IncomeSource.IncomeSource): IncomeSummary =>
  Match.valueTags(source, {
    FreelanceIncome: freelanceSummary,
    SalaryIncome: salarySummary
  })
