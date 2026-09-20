/**
 * The seed household, as data (spec §42 to §49, DAT-03).
 *
 * **Every figure here is fictional**, taken from the specification's own
 * development seed rather than from anybody's finances. That is what makes
 * this file committable: the repository is public, and a seed built from real
 * numbers would either leak them or have to be gitignored, which would leave
 * the seed non-reproducible for anyone else and for CI.
 *
 * Separate from the code that inserts it so the figures can be read and
 * changed without reading the insertion at all (§41: seed data isolated from
 * domain logic).
 */
export const SEED = {
  household: { name: "Sam & Alex", first: "Sam", second: "Alex" },

  freelance: {
    name: "Freelance",
    dailyRateEuros: 600,
    payoutPercent: 80,
    billableDays: 20,
    /** §11: holidays and a quiet December, as the spec's own example has them. */
    overrides: new Map([
      ["2026-08", 12],
      ["2026-12", 10]
    ]),
    startDate: "2026-01-01"
  },

  salary: {
    name: "Salary",
    monthlyNetBeforeTaxEuros: 3_100,
    monthlyIncomeTaxEuros: 0,
    startDate: "2026-01-01"
  },

  expenses: [
    { name: "Rent", amountEuros: 1_280 },
    { name: "Sam personal budget", amountEuros: 1_100 },
    { name: "Alex personal budget", amountEuros: 1_100 },
    { name: "Family support — overseas", amountEuros: 450 }
  ],

  debt: {
    name: "Card debt",
    initialAmountEuros: 11_000,
    interestRatePercent: 0,
    regularPaymentEuros: 900,
    startDate: "2026-01-01"
  },

  /** §48: a confirmed liability with an uneven final instalment. */
  confirmedTax: {
    name: "2025 income tax settlement",
    year: 2025,
    totalEuros: 21_215,
    schedule: [
      { date: "2026-09-25", amountEuros: 5_303 },
      { date: "2026-10-26", amountEuros: 5_303 },
      { date: "2026-11-26", amountEuros: 5_303 },
      { date: "2026-12-28", amountEuros: 5_306 }
    ]
  },

  /** §49: marked estimated, and must never read as confirmed tax debt. */
  estimatedTax: {
    name: "2026 tax catch-up",
    year: 2026,
    totalEuros: 14_000,
    schedule: [{ date: "2027-09-15", amountEuros: 14_000 }]
  },

  recurringTax: {
    name: "BNC/PAS payment",
    amountEuros: 1_600,
    startDate: "2026-09-01"
  },

  holdings: [
    {
      kind: "BankAccount" as const,
      name: "Joint current account",
      institution: "Development Bank",
      valueEuros: 24_000,
      on: "2026-09-30"
    },
    {
      kind: "BankAccount" as const,
      name: "Emergency fund",
      institution: "Development Bank",
      valueEuros: 6_000,
      on: "2026-09-30"
    },
    {
      kind: "PhysicalAsset" as const,
      name: "Dive watch",
      category: "watch",
      valueEuros: 4_200,
      acquisitionCostEuros: 5_100,
      acquiredOn: "2024-03-01",
      on: "2026-09-30"
    }
  ],

  goal: { name: "€150k", targetEuros: 150_000 }
} as const
