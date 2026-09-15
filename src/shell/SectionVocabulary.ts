import type { Section } from "@/shell/routing/Section"

export interface SectionCopy {
  readonly title: string
  readonly description: string
}

/**
 * Copy as data, so it is reviewable in one place and the components stay free
 * of English (architecture.md — React).
 *
 * Every line says what the screen is for and what to do next. "No data" tells a
 * person neither, and an app with nothing in it should not read as broken.
 */
export const EMPTY_STATES: Record<Section, SectionCopy> = {
  dashboard: {
    title: "Nothing to project yet",
    description:
      "Delta needs three things before it can answer: who is in the household, what you have, and what you are saving for. Start with the household in Settings."
  },
  projection: {
    title: "No projection yet",
    description:
      "Once there is income, commitments and a starting balance, this is the month-by-month path to the goal — recorded history solid, forecast dashed."
  },
  capital: {
    title: "No accounts or assets yet",
    description:
      "Capital is everything that counts toward the goal: bank accounts, and physical assets at what they would actually sell for. Add the first one to see where you stand."
  },
  commitments: {
    title: "Nothing committed yet",
    description:
      "Rent, subscriptions, debt repayments and tax all live here — anything leaving the household on a schedule. Add one to start shaping the projection."
  },
  scenarios: {
    title: "No scenarios yet",
    description:
      "A scenario asks what a change would cost in time: a higher rate, a large purchase, selling an asset. Build one to compare it against where you are heading."
  },
  settings: {
    title: "Settings",
    description: "The household, the goal, storage and backup."
  }
}
