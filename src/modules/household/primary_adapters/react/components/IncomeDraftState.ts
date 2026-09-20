/**
 * The add-income form's own state: every field a string, exactly as the inputs
 * produce them.
 *
 * Nothing is converted on the way out of a keystroke. The use case converts
 * once, on submit, and is the only thing that decides whether a value is a
 * daily rate — which is why a half-typed "1." never has to be a number here.
 */
import type { PersonId } from "@/modules/household/core/domain/Household"

export type IncomeKind = "freelance" | "salary"

export interface IncomeDraft {
  readonly kind: IncomeKind
  readonly name: string
  readonly startDate: string
  readonly endDate: string
  readonly dailyRateEuros: string
  readonly estimatedPayoutPercent: string
  readonly standardBillableDays: string
  readonly overrides: ReadonlyMap<string, number>
  readonly monthlyNetBeforeTaxEuros: string
  readonly monthlyIncomeTaxEuros: string
  readonly annualGrossEuros: string
}

export const emptyIncomeDraft: IncomeDraft = {
  kind: "freelance",
  name: "",
  startDate: "",
  endDate: "",
  dailyRateEuros: "",
  estimatedPayoutPercent: "",
  standardBillableDays: "",
  overrides: new Map(),
  monthlyNetBeforeTaxEuros: "",
  monthlyIncomeTaxEuros: "",
  annualGrossEuros: ""
}

const freelanceReady = (draft: IncomeDraft): boolean =>
  draft.dailyRateEuros !== "" &&
  draft.estimatedPayoutPercent !== "" &&
  draft.standardBillableDays !== ""

const salaryReady = (draft: IncomeDraft): boolean =>
  draft.monthlyNetBeforeTaxEuros !== "" && draft.monthlyIncomeTaxEuros !== ""

/**
 * Only emptiness, never validity. Whether 140% is a payout ratio is the
 * domain's answer, and a form that pre-judged it would be a second, drifting
 * copy of the rule.
 */
export const isReady = (draft: IncomeDraft): boolean =>
  draft.name.trim() !== "" &&
  draft.startDate !== "" &&
  (draft.kind === "freelance" ? freelanceReady(draft) : salaryReady(draft))

/**
 * The one conversion from form strings to a use-case draft. Numbers are parsed
 * here and judged there: `Number("abc")` is NaN, which `Money.fromEuros`
 * refuses, so a typo arrives as a typed error rather than as a zero.
 */
export const freelanceDraftFor = (personId: PersonId, draft: IncomeDraft) => ({
  personId,
  name: draft.name.trim(),
  dailyRateEuros: Number(draft.dailyRateEuros),
  estimatedPayoutPercent: Number(draft.estimatedPayoutPercent),
  standardBillableDays: Number(draft.standardBillableDays),
  overrides: draft.overrides,
  startDate: draft.startDate,
  endDate: draft.endDate === "" ? undefined : draft.endDate
})

export const salaryDraftFor = (personId: PersonId, draft: IncomeDraft) => ({
  personId,
  name: draft.name.trim(),
  monthlyNetBeforeTaxEuros: Number(draft.monthlyNetBeforeTaxEuros),
  monthlyIncomeTaxEuros: Number(draft.monthlyIncomeTaxEuros),
  annualGrossEuros: draft.annualGrossEuros === "" ? undefined : Number(draft.annualGrossEuros),
  startDate: draft.startDate,
  endDate: draft.endDate === "" ? undefined : draft.endDate
})
