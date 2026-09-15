# Delta — Product & Technical Specification

## 1. Product Vision

**Delta** is a private, local-first financial projection application.

Its primary purpose is to answer:

> Given our current financial situation and trajectory, when will we reach our financial goal?

Delta is not primarily a budgeting application, accounting application, or bank transaction tracker.

Its core purpose is to translate financial decisions into **time-to-goal**.

Examples:

- Increasing a freelance daily rate may move the goal closer.
- Paying off a debt may increase future monthly savings.
- A large purchase may delay the goal.
- A change in household income may accelerate or delay the goal.
- Actual savings being above or below the forecast recalibrates the trajectory.

The central product concept is:

> **Actual data defines the past and present. Models estimate the future.**

---

# 2. Core Product Principles

## 2.1 Generic domain

Delta must not contain financial values specific to Sam or Alex as business rules.

Every figure in this document is illustrative. Sam and Alex are invented, and so are
their rates, balances and commitments — the arithmetic holds, but nobody's actual
finances are described here. Real seed values live in `seed.local.md`, which is not
committed.

Values such as:

- €600 daily rate
- €150,000 goal
- €24,000 current savings
- €1,280 rent
- €450 family support
- €11,000 debt
- tax amounts

are **user data**, not application constants.

They may exist as development seed data.

---

## 2.2 Local first

V1 is completely local.

There is:

- no backend
- no bank integration
- no Open Banking
- no cloud account
- no remote authentication
- no financial data upload
- no telemetry containing financial information

Data is stored locally in SQLite.

---

## 2.3 Reality overrides estimates

Historical financial reality must never be reconstructed from forecasts when an actual value exists.

Example:

Delta predicted:

    Savings on 31 October: €29,500

Actual savings are:

    €28,000

The user records a SavingsSnapshot of €28,000.

From that point onward:

    €28,000

becomes the new source of truth.

Delta recalculates all future projections from that value.

---

# 3. Technology

## Desktop

- macOS first
- Tauri

## Frontend

- React
- TypeScript

## Domain / application layer

- TypeScript
- Effect where appropriate

Effect should be used for:

- services
- dependency management
- persistence
- configuration
- validation
- typed errors
- application workflows

Pure financial calculations should remain pure functions where possible.

Do not use Effect merely to wrap trivial arithmetic.

## Persistence

- SQLite
- local only

React components MUST NOT access SQLite directly.

---

# 4. High-Level Domain Model

The central model is:

    Household
        │
        ├── Person[]
        │     │
        │     └── IncomeSource[]
        │            ├── FreelanceIncome
        │            └── SalaryIncome
        │
        ├── FinancialCommitment[]
        │     ├── RecurringExpense
        │     ├── OneOffExpense
        │     ├── Debt
        │     └── TaxLiability
        │
        ├── FinancialGoal[]
        │
        ├── SavingsSnapshot[]
        │
        └── DebtSnapshot[]

These objects feed:

    ProjectionEngine

which produces:

    Projection

---

# 5. Household

Delta manages one household in V1.

A household contains one or more people.

Conceptually:

```ts
interface Household {
  readonly id: HouseholdId
  readonly name: string
  readonly members: ReadonlyArray<Person>
}
```

Example development data:

    Sam & Alex

However, these names must never be hard-coded into the domain.

Another user may create:

    Alice

or:

    Alice & Bob

or any other household.

---

# 6. Person

A household contains `1..N` people.

Conceptually:

```ts
interface Person {
  readonly id: PersonId
  readonly householdId: HouseholdId
  readonly name: string
}
```

A person may have one or more income sources.

Example:

    Sam
        └── FreelanceIncome

    Alex
        └── SalaryIncome

The domain must not assume:

- exactly two people
- one freelancer
- one employee
- a married couple
- specific names

---

# 7. Income Sources

Income belongs to a person.

V1 supports at least:

```ts
type IncomeSource =
  | FreelanceIncome
  | SalaryIncome
```

The architecture should allow additional income source types later without modifying the ProjectionEngine.

Examples of possible future sources:

- rental income
- pension
- dividends
- fixed recurring income

These are out of scope for V1 unless trivial to support generically.

---

# 8. Freelance Income

A freelance income source contains the parameters required to estimate personal cash generated from freelance activity.

Conceptually:

```ts
interface FreelanceIncome {
  readonly id: IncomeSourceId
  readonly personId: PersonId

  readonly name: string

  readonly dailyRate: Money
  readonly estimatedPayoutRatio: Percentage

  readonly startDate: LocalDate
  readonly endDate?: LocalDate

  readonly enabled: boolean
}
```

Billable days are configurable separately by month or through default assumptions.

---

# 9. Freelance Revenue Calculation

For a given month:

    RevenueHT
    = DailyRate × BillableDays

Example:

    €600 × 20
    = €12,000 HT

Delta then estimates how much can become personal cash before personal income tax.

    EstimatedTransferable
    = RevenueHT × EstimatedPayoutRatio

Example:

    €12,000 × 80%
    = €9,600

The current development assumption is:

    80%

This value MUST be configurable.

It MUST NOT be hard-coded as a universal rule.

---

# 10. Umbrella Company Transfer Estimation

The payout ratio exists because the amount invoiced by the company is not equal to the amount that can necessarily be transferred personally.

The actual amount may vary because of:

- professional expenses
- VAT
- social liabilities
- CSG / contributions
- accounting adjustments
- umbrella company fees
- treasury reserves
- safety reserves
- professional purchases
- other company liabilities

Therefore Delta must label this result as an **estimate**.

For example:

    Revenue HT               €12,000
    Estimated payout ratio       80%
    Estimated transferable   €9,600

Delta MUST NOT present €9,600 as a guaranteed umbrella transfer.

The current 80% assumption may later be replaced by a more precise model if the umbrella company's calculation is better understood.

The architecture should allow the payout model to evolve without changing the ProjectionEngine.

---

# 11. Billable Days

Billable days must be configurable.

Delta should support:

1. a default monthly assumption;
2. explicit monthly overrides.

Example:

    Default:
    20 days/month

    August:
    12 days

    December:
    10 days

Future versions may derive billable days from:

- annual working days
- vacation weeks
- public holidays

For V1, explicit/default billable-day configuration is sufficient.

---

# 12. Salary Income

Employees are supported as household members.

A salary income source does NOT require a complete French payroll engine in V1.

Conceptually:

```ts
interface SalaryIncome {
  readonly id: IncomeSourceId
  readonly personId: PersonId

  readonly name: string

  readonly monthlyNetBeforeTax: Money
  readonly monthlyIncomeTax: Money

  readonly startDate: LocalDate
  readonly endDate?: LocalDate

  readonly enabled: boolean
}
```

Calculation:

    SalaryNetAfterTax
    = MonthlyNetBeforeTax - MonthlyIncomeTax

Actual payroll values should be preferred when available.

Optional informational fields may include:

    annualGrossSalary

but Delta V1 does NOT need to calculate:

    French gross salary
        → social contributions
        → taxable salary
        → income tax
        → net salary

That may be implemented later.

---

# 13. Household Income

For month `M`:

    HouseholdIncome(M)
    = Σ IncomeSourceCashFlow(M)

Example:

    Sam freelance    €8,200
    Alex salary         €3,100
                           -------
    Household income      €11,300

The ProjectionEngine should not contain special logic for specific people.

Each income source produces cash flows.

The engine aggregates them.

---

# 14. Financial Goal

Goals are configurable.

Conceptually:

```ts
interface FinancialGoal {
  readonly id: FinancialGoalId
  readonly householdId: HouseholdId

  readonly name: string
  readonly targetAmount: Money
  readonly enabled: boolean
}
```

Development seed:

    Name:
    €150k

    Target:
    €150,000

The target amount MUST NOT be hard-coded.

The architecture should support multiple goals eventually, even if V1 primarily displays one active goal.

---

# 15. Savings Snapshots

Savings history is represented by actual snapshots.

Conceptually:

```ts
interface SavingsSnapshot {
  readonly id: SavingsSnapshotId
  readonly householdId: HouseholdId

  readonly date: LocalDate
  readonly amount: Money
}
```

Example:

    12 Sep 2026
    €24,000

Later:

    31 Oct 2026
    €28,000

Snapshots are the source of truth for actual historical savings.

---

# 16. Monthly Savings Update

The main recurring user action should be extremely simple.

Primary action:

    Update savings

Form:

    Current savings
    [ €28,000 ]

    Date
    [ 31 October 2026 ]

    Save

Delta compares this with the previous projection.

Example:

    Expected: €29,500
    Actual:   €28,000

    Delta:    -€1,500

Delta then recalculates all future months from €28,000.

Example feedback:

    €1,500 behind plan

    Goal moved:
    October 2028 → November 2028

The user does NOT need to enter every bank transaction.

---

# 17. Financial Commitments

Money leaving the household is represented through financial commitments.

Conceptually:

```ts
type FinancialCommitment =
  | RecurringExpense
  | OneOffExpense
  | Debt
  | TaxLiability
```

These types preserve different business semantics while exposing future cash flows to the ProjectionEngine.

The ProjectionEngine should not contain special-case calculations such as:

```ts
if (commitment.type === "tax") { ... }
```

unless absolutely necessary.

Instead, commitments should be converted into dated cash flows before projection.

---

# 18. Recurring Expense

Examples:

- rent
- personal budget
- family support
- subscriptions
- recurring household expenses

Conceptually:

```ts
interface RecurringExpense {
  readonly id: CommitmentId
  readonly householdId: HouseholdId

  readonly name: string
  readonly amount: Money

  readonly frequency: "monthly"

  readonly startDate: LocalDate
  readonly endDate?: LocalDate

  readonly enabled: boolean
}
```

Example:

    Rent
    €1,280/month
    No end date

produces:

    Sep 2026   -€1,280
    Oct 2026   -€1,280
    Nov 2026   -€1,280
    ...

---

# 19. One-Off Expense

A one-off expense represents a known or hypothetical future purchase.

Conceptually:

```ts
interface OneOffExpense {
  readonly id: CommitmentId
  readonly householdId: HouseholdId

  readonly name: string
  readonly amount: Money
  readonly date: LocalDate

  readonly enabled: boolean
}
```

Examples:

    Vacation
    €6,500
    August 2027

or:

    Luxury purchase
    €11,500
    December 2026

The corresponding month receives the negative cash flow.

Delta then recalculates the target date.

---

# 20. Debt

Debt is a first-class domain object.

It must NOT be represented merely as a recurring expense because Delta needs to track its state.

Conceptually:

```ts
interface Debt {
  readonly id: DebtId
  readonly householdId: HouseholdId

  readonly name: string

  readonly initialAmount: Money
  readonly interestRate: Percentage

  readonly regularPaymentAmount: Money
  readonly paymentFrequency: "monthly"

  readonly startDate: LocalDate

  readonly enabled: boolean
}
```

The current remaining balance should be derived from the latest actual `DebtSnapshot` when one exists.

---

# 21. Debt Snapshot

Actual debt balances are recorded as snapshots.

Conceptually:

```ts
interface DebtSnapshot {
  readonly id: DebtSnapshotId
  readonly debtId: DebtId

  readonly date: LocalDate
  readonly remainingAmount: Money
}
```

Example:

    Card debt

    Initial:
    €11,000

Later:

    31 Dec 2026
    €7,200 remaining

If Delta predicted €7,350 but the actual remaining balance is €7,200, the actual snapshot becomes the new source of truth.

Future debt projections continue from €7,200.

---

# 22. Debt Calculations

Delta calculates:

    remaining balance
    repayment progress
    estimated payments remaining
    estimated payoff date
    future debt cash flows

For a 0% debt:

    NextRemainingBalance
    = max(0, CurrentRemainingBalance - Payment)

The final payment must never exceed the remaining balance.

Example:

    Remaining: €400
    Normal payment: €900

Actual final payment:

    €400

not:

    €900

When:

    RemainingBalance = 0

the debt becomes effectively paid and no additional debt cash flows are generated.

---

# 23. Debt UI

Example:

    Card debt

    €11,000 → €7,200

    ███████████░░░░

    35% repaid

    Monthly payment:
    €900

    Estimated remaining:
    8 months

    Estimated payoff:
    August 2027

The user must be able to update the actual remaining debt.

---

# 24. Tax Liabilities

Taxes are represented as `TaxLiability`.

They belong to FinancialCommitments in the UI/domain hierarchy, but retain tax-specific semantics.

Conceptually:

```ts
interface TaxLiability {
  readonly id: TaxLiabilityId
  readonly householdId: HouseholdId

  readonly name: string
  readonly taxYear?: number

  readonly status:
    | "estimated"
    | "confirmed"

  readonly estimatedOrConfirmedAmount: Money

  readonly paymentSchedule: ReadonlyArray<ScheduledPayment>

  readonly enabled: boolean
}
```

---

# 25. Scheduled Payment

Some commitments cannot be accurately represented as a fixed monthly amount.

Use explicit scheduled payments.

Conceptually:

```ts
interface ScheduledPayment {
  readonly date: LocalDate
  readonly amount: Money
}
```

Example:

    Sep 2026   €5,303
    Oct 2026   €5,303
    Nov 2026   €5,303
    Dec 2026   €5,306

This is preferable to assuming:

    €5,303/month

because actual schedules may contain different amounts.

---

# 26. Confirmed vs Estimated Tax

Delta must clearly distinguish:

## Confirmed

A known liability with known amounts.

Example:

    2025 income tax settlement

    Status:
    CONFIRMED

## Estimated

A future tax liability whose exact amount is not yet known.

Example:

    Estimated 2026 tax catch-up

    Status:
    ESTIMATED

The UI must visually communicate uncertainty.

An estimated tax liability MUST NOT be presented as an exact tax debt.

---

# 27. Recurring Tax Payments / PAS

Recurring current tax payments may be represented separately from future liabilities.

For example:

```ts
interface RecurringTaxPayment {
  readonly id: TaxPaymentId
  readonly personId?: PersonId

  readonly name: string
  readonly amount: Money

  readonly startDate: LocalDate
  readonly endDate?: LocalDate
}
```

Example:

    BNC/PAS payment
    €1,600/month
    Starting September 2026

If the amount changes later:

    Old rule:
    ends September

    New rule:
    starts October

This preserves historical and projected correctness.

---

# 28. Commitments UI

Do NOT create separate top-level navigation sections for:

- Taxes
- Debt
- Expenses
- Budgets

Use one section:

    Commitments

Example:

    COMMITMENTS

    Rent
    €1,280/month

    Family support
    €450/month

    Card debt
    €7,200 remaining
    €900/month
    8 months remaining

    2025 income tax
    €21,215 scheduled
    Confirmed

    2026 tax catch-up
    ~€14,000
    Estimated

    + Add commitment

Different commitment types may have different icons, labels and detail views.

---

# 29. Cash Flow Representation

Income sources and financial commitments should ultimately be converted into dated cash flows.

Conceptually:

```ts
interface CashFlow {
  readonly date: LocalDate
  readonly amount: Money

  readonly sourceId: string
  readonly sourceType: string
}
```

Positive:

    income

Negative:

    expense / debt payment / tax

Example:

                  Sep       Oct       Nov       Dec

Freelance      +8,200    +8,200    +8,200    +8,200
Salary         +3,100    +3,100    +3,100    +3,100
Rent           -1,280    -1,280    -1,280    -1,280
Card debt        -900      -900      -900      -900
Tax 2025       -5,303    -5,303    -5,303    -5,306

The ProjectionEngine aggregates these cash flows.

---

# 30. Projection Engine

The ProjectionEngine is the heart of Delta.

For every month `M`:

    Income(M)
    = Σ positive income cash flows

    Commitments(M)
    = Σ negative commitment cash flows

    NetCashFlow(M)
    = Income(M) + Commitments(M)

Since commitment cash flows are negative, they are added mathematically.

Then:

    EndingSavings(M)
    = StartingSavings(M) + NetCashFlow(M)

And:

    StartingSavings(M + 1)
    = EndingSavings(M)

The engine continues until:

    EndingSavings >= FinancialGoal.targetAmount

---

# 31. Projection Result

Conceptually:

```ts
interface ProjectionResult {
  readonly goalId: FinancialGoalId

  readonly startingSavings: Money

  readonly targetAmount: Money

  readonly targetDate?: LocalDate

  readonly monthsRemaining?: number

  readonly months: ReadonlyArray<ProjectionMonth>
}
```

Each month:

```ts
interface ProjectionMonth {
  readonly month: YearMonth

  readonly startingSavings: Money

  readonly income: Money
  readonly commitments: Money

  readonly netCashFlow: Money

  readonly endingSavings: Money

  readonly cashFlows: ReadonlyArray<CashFlow>
}
```

---

# 32. Projection Safety

The engine must support cases where the goal cannot currently be reached.

Example:

    Monthly household cash flow = -€400

The engine MUST NOT loop forever.

It should return something like:

```ts
type ProjectionStatus =
  | { type: "reachable"; targetDate: LocalDate }
  | { type: "not-reachable" }
```

A maximum projection horizon should also exist.

Example:

    50 years

The exact limit should be configurable internally.

---

# 33. Actual vs Forecast

Projection data must clearly distinguish:

    ACTUAL
    FORECAST

Historical snapshots are actual.

Future projection months are forecasts.

The main chart should visually distinguish them.

Example:

    Actual ━━━━━━━━━●
                    ╲
                     ╲ Forecast
                      ╲
                       ╲──────── 🎯 €150k

The latest SavingsSnapshot is the starting point for the future projection.

---

# 34. Scenarios

Delta should support temporary simulations without modifying actual configuration.

Examples:

    What if TJM becomes €700?

    What if I work only 16 days/month?

    What if we spend €11,500?

    What if we reduce expenses by €400/month?

The scenario produces a separate projection.

Example:

    CURRENT

    TJM €600
    Target: October 2028

    SIMULATION

    TJM €700
    Target: July 2028

    Δ -3 months

The user must explicitly apply a scenario before it modifies real configuration.

---

# 35. Scenario Architecture

Conceptually:

```ts
interface Scenario {
  readonly id: ScenarioId
  readonly name: string

  readonly overrides: ReadonlyArray<ScenarioOverride>
}
```

A scenario should preferably store overrides rather than duplicate the entire household database.

Examples:

    ChangeDailyRate
    ChangeBillableDays
    AddHypotheticalExpense
    DisableCommitment
    ChangeIncome
```

Exact implementation may evolve during development.

---

# 36. Time Cost

One of Delta's key features is translating money into time.

Example:

    Hypothetical purchase:
    €11,500

Baseline:

    Goal: October 2028

With purchase:

    Goal: December 2028

Delta displays:

    Impact:
    +2 months

Likewise:

    TJM €600 → €700

may display:

    Impact:
    -3 months

The exact value always comes from comparing two ProjectionResults.

It must never use a hard-coded formula such as:

    €8,000 = 1.5 months

because the time impact depends on the complete household trajectory.

---

# 37. Dashboard

The Dashboard should remain focused.

Primary hierarchy:

    DELTA

    €24,000
    ─────────
    €150,000

    15% reached

    Estimated target
    October 2028

    25 months remaining

Then:

    Current trajectory

    Household income
    Commitments
    Expected monthly savings

Then:

    Goal projection chart

Then:

    Active debts / important commitments

Primary action:

    Update savings

---

# 38. Projection Chart

The primary chart shows:

    X axis:
    time

    Y axis:
    household savings

It displays:

- historical actual savings
- future projected savings
- financial goal
- projected goal intersection

Optional future enhancements may annotate:

- debt payoff
- tax settlements
- exceptional purchases

---

# 39. Household Settings

Users must be able to manage household members.

Example:

    HOUSEHOLD

    Sam
    Freelance
    €600/day
    Edit

    Alex
    Employee
    €X/month
    Edit

    + Add person

Adding a person:

    Name
    [____________]

    + Add income source

Income type:

    Freelance
    Employee

The application should not require exactly one income source per person.

---

# 40. Configurable Data

The following MUST be user-configurable and persisted:

## Household

- household name
- household members

## People

- names
- income sources

## Freelance income

- TJM
- billable days
- payout ratio
- effective dates
- associated tax/PAS assumptions

## Salary income

- monthly net before tax
- PAS / monthly tax
- effective dates
- optional gross salary information

## Financial goals

- name
- target amount

## Savings

- actual dated snapshots

## Expenses

- name
- amount
- recurrence
- dates
- enabled status

## Debt

- name
- initial balance
- actual remaining balance snapshots
- interest rate
- payment amount
- dates

## Tax

- liability name
- tax year
- estimated / confirmed status
- amount
- payment schedule

## Projection assumptions

- configurable assumptions needed by income models

No household-specific amount belongs in application source code.

---

# 41. Development Seed Data

Development builds should support optional realistic seed data.

Seed data MUST be isolated from domain logic.

Production MUST NOT automatically insert this data.

---

# 42. Development Household Seed

Create:

    Household:
    Sam & Alex

Members:

    Sam
    Alex

---

# 43. Development Goal Seed

Create:

    Name:
    €150k

    Target:
    €150,000

Initial savings snapshot:

    September 2026
    €24,000

---

# 44. Sam Development Income Seed

Create a FreelanceIncome:

    Name:
    Freelance

    TJM:
    €600

    Estimated payout ratio:
    80%

Use configurable billable days.

Current realistic planning assumption:

    approximately 20 billable days for a full month

This is seed/configuration data, not a business rule.

---

# 45. Alex Development Income Seed

Create a SalaryIncome.

Use current approximate actual payroll values as development data.

Initial approximate monthly cash income:

    ~€3,100 before future PAS adjustment

The exact value remains editable.

---

# 46. Development Recurring Expense Seed

Create:

    Rent
    €1,280/month

Create:

    Sam personal budget
    €1,100/month

Create:

    Alex personal budget
    €1,100/month

Create:

    Family support — overseas
    €450/month

All values are development data.

---

# 47. Development Debt Seed

Create:

    Card debt

    Initial balance:
    €11,000

    Interest:
    0%

    Regular payment:
    approximately €900/month

    Duration:
    approximately 12 months

Exact dates and actual remaining balance remain editable.

---

# 48. Development 2025 Tax Seed

Create a confirmed TaxLiability:

    Name:
    2025 income tax settlement

    Tax year:
    2025

    Status:
    Confirmed

    Total:
    €21,215

Schedule:

    25 Sep 2026    €5,303
    26 Oct 2026    €5,303
    26 Nov 2026    €5,303
    28 Dec 2026    €5,306

These values represent confirmed scheduled payments.

---

# 49. Development 2026 Tax Seed

Current recurring tax payments may be seeded from the currently known PAS/acompte configuration.

Current known total recurring automatic payment:

    €1,600/month

This includes the currently known BNC/BIC/social levy components.

The value must remain editable because it may change after the user's tax situation is updated.

An estimated future 2026 tax catch-up may also be represented.

If seeded:

    Status:
    Estimated

It MUST be clearly marked as an approximation.

Do not treat the current rough estimate as confirmed tax debt.

---

# 50. Seed Architecture

Suggested structure:

    src/
      domain/
      application/
      infrastructure/
        persistence/
          sqlite/
            migrations/
            repositories/
            seed/
              developmentSeed.ts

Seed execution must be:

- explicit
- development-only
- idempotent

Running the seed multiple times must not create duplicate records.

---

# 51. Database Environments

Development:

    migrations
    +
    optional development seed

Test:

    migrations
    +
    deterministic test fixtures

Production:

    migrations only

There should be a convenient development workflow conceptually equivalent to:

    reset-dev-db
    migrate
    seed-dev-db

Exact commands are an implementation decision.

---

# 52. Persistence Architecture

Persistence must be behind repository interfaces.

Potential services:

```ts
interface HouseholdRepository {}
interface IncomeRepository {}
interface CommitmentRepository {}
interface SavingsRepository {}
interface DebtRepository {}
interface GoalRepository {}
```

Do not over-fragment repositories if a simpler aggregate-oriented repository proves cleaner.

Infrastructure implementation:

    SQLite

Domain/application code should not depend directly on SQLite.

---

# 53. Suggested Application Services

Potential services:

    ProjectionService
    HouseholdService
    CommitmentService
    SavingsService
    DebtService
    ScenarioService

Income-specific calculations may be implemented through pure domain functions or services such as:

    FreelanceIncomeCalculator
    SalaryIncomeCalculator

Use Effect for orchestration and dependency injection where it provides value.

---

# 54. Domain Errors

Prefer explicit typed errors.

Examples:

    InvalidMoneyAmount
    InvalidDailyRate
    InvalidBillableDays
    InvalidPayoutRatio
    InvalidDebtBalance
    InvalidPaymentSchedule
    InvalidGoal
    ProjectionNotReachable
    PersistenceError

Do not use generic exceptions for expected domain failures.

---

# 55. Money

Financial arithmetic must avoid floating-point precision problems.

Do NOT model money as arbitrary JavaScript floating-point values without a defined strategy.

Recommended approaches include:

    integer cents

or a dedicated Money value object.

Conceptually:

```ts
interface Money {
  readonly cents: number
}
```

Example:

    €600.00
    = 60_000 cents

Rounding rules must be deterministic.

---

# 56. Dates

Financial projections operate primarily at monthly granularity.

Use explicit domain representations such as:

    LocalDate
    YearMonth

Do not rely on browser timezone conversions for financial month calculations.

The same inputs must produce the same projection regardless of machine timezone.

---

# 57. Determinism

The ProjectionEngine MUST be deterministic.

Given the same:

- savings snapshot
- income configuration
- commitments
- goal
- assumptions

it MUST return the same result.

The projection engine should be extensively unit tested independently of:

- React
- Tauri
- SQLite

---

# 58. Required Calculation Tests

At minimum, test:

## Freelance revenue

    €600 × 20 days
    = €12,000 HT

## Payout estimate

    €12,000 × 80%
    = €9,600

## Recurring expense

A €1,280 monthly expense generates exactly one €1,280 negative cash flow per active month.

## One-off expense

A €11,500 purchase affects only the configured month.

## Debt final payment

If:

    remaining = €400
    regular payment = €900

then:

    payment = €400
    remaining = €0

## Debt completion

No debt payment occurs after the debt reaches zero.

## Tax schedule

The 2025 seed produces exactly:

    €5,303
    €5,303
    €5,303
    €5,306

on the configured dates.

## Savings snapshot override

If projected savings were €29,500 but a new actual snapshot is €28,000, future projection starts from €28,000.

## Goal reach

Projection stops when savings reach or exceed the configured target.

## Unreachable goal

A permanently negative trajectory returns `not-reachable` rather than looping forever.

---

# 59. V1 Navigation

Keep navigation intentionally small.

Recommended:

    Dashboard
    Projection
    Commitments
    Settings

Household/member management may live under Settings.

Do NOT create separate navigation sections for:

    Transactions
    Bank Accounts
    Taxes
    Debt
    Budgets
    Salary
    Freelance

unless future product usage demonstrates a need.

---

# 60. Explicitly Out of Scope — V1

Do NOT implement:

- bank synchronization
- BNP integration
- Open Banking
- transaction import
- transaction categorization
- Umbrella company API integration
- impots.gouv.fr integration
- automatic invoice synchronization
- automatic payroll retrieval
- full French salary gross-to-net engine
- full French income tax engine
- mobile app
- cloud backend
- multi-device synchronization
- authentication
- investment portfolio management

---

# 61. Potential V2 Features

Possible later additions:

## Open Banking

Read-only account balance synchronization.

## Umbrella company integration

Retrieve:

- invoices
- treasury
- liabilities
- available transfer

if an appropriate API exists.

## Advanced freelance payout model

Replace the simple configurable payout ratio with a more accurate model.

## French tax engine

Estimate annual household income tax and future catch-up automatically.

## Advanced salary engine

Gross salary → net salary → PAS estimation.

## Additional income types

- rental
- dividends
- pension
- recurring fixed income

## iCloud synchronization

Synchronize Delta between personal Apple devices without necessarily operating a traditional backend.

---

# 62. UX Principle

Delta should never require users to maintain perfect accounting data.

The minimum recurring workflow should remain:

    Open Delta
        ↓
    Update actual savings
        ↓
    optionally update debt balances
        ↓
    Delta recalculates
        ↓
    See new target date

Detailed commitments improve forecast quality.

Snapshots preserve correctness when reality differs from the model.

---

# 63. Core Calculation Summary

For month `M`:

```text
FreelanceRevenue(M)
    = DailyRate × BillableDays(M)

FreelanceTransferEstimate(M)
    = FreelanceRevenue(M) × PayoutRatio

FreelancePersonalIncome(M)
    = FreelanceTransferEstimate(M)
      - applicable personal tax payments

SalaryIncome(M)
    = NetSalaryBeforeTax(M)
      - SalaryTax(M)

HouseholdIncome(M)
    = Σ IncomeSources(M)

CommitmentCashFlow(M)
    = Σ FinancialCommitments(M)

NetCashFlow(M)
    = HouseholdIncome(M)
      + CommitmentCashFlow(M)

Savings(M)
    = Savings(M - 1)
      + NetCashFlow(M)
```

Commitment cash flows are negative.

Projection continues until:

```text
Savings(M) >= FinancialGoal.Target
```

The resulting month determines the estimated goal date.

---

# 64. Core Product Question

Every major feature should ultimately help answer:

> **How does this change my trajectory?**

Examples:

    TJM €600 → €700
    Δ target date: -X months

    New €11,500 expense
    Δ target date: +X months

    Debt paid off early
    Δ target date: -X months

    Actual savings €1,500 below forecast
    Δ target date: +X weeks/months

This is the defining behavior of Delta.

---

# 65. V1 Success Criteria

V1 is successful if a user can:

1. Create a household.
2. Add one or more people.
3. Give each person freelance or salary income.
4. Configure freelance TJM and billable days.
5. Configure salary income.
6. Create a financial goal.
7. Record current savings.
8. Add recurring expenses.
9. Add one-off expenses.
10. Add and track debts.
11. Record actual remaining debt.
12. Add confirmed or estimated tax liabilities.
13. Configure scheduled tax payments.
14. See projected monthly household cash flow.
15. See projected savings over time.
16. See the estimated date at which the goal is reached.
17. Update actual savings and immediately recalibrate the projection.
18. Simulate changes without modifying the real plan.
19. See the time impact of those simulations.
20. Perform all of this without connecting a bank account.

---

# 66. Definition of Delta

Delta is not a ledger.

Delta is not a bank aggregator.

Delta is not an accounting system.

Delta is a **household financial trajectory engine**.

Its job is to combine:

    where you actually are
    +
    what you currently earn
    +
    what you are committed to paying
    +
    what you expect to happen
    =
    when you will reach your goal

And when reality changes:

    Delta recalculates the path.
---

# 67. Capital — Amendment to §15, §16, §31, §37

Total capital is no longer a single savings figure.

It is composed:

    TotalCapital
    = Σ included bank account balances
    + Σ included physical asset resale values

The projection's starting balance is total capital, not a lone `SavingsSnapshot`.

---

# 68. Holdings

A holding is anything the household owns that contributes to capital.

```ts
type Holding =
  | BankAccount
  | PhysicalAsset
```

Holdings follow the same tagged-union pattern as `IncomeSource` (§7) and
`FinancialCommitment` (§17). The architecture must allow further holding types
later — investment accounts, vehicles, property — without modifying the
ProjectionEngine.

---

# 69. Bank Account

```ts
interface BankAccount {
  readonly id: HoldingId
  readonly householdId: HouseholdId

  readonly name: string
  readonly institution?: string

  readonly includedInCapital: boolean
  readonly enabled: boolean
}
```

A bank account has no intrinsic amount. Its value at any date comes from its
balance history (§71).

Examples:

    Joint current account
    Emergency fund
    Sam business reserve

---

# 70. Physical Asset

```ts
interface PhysicalAsset {
  readonly id: HoldingId
  readonly householdId: HouseholdId

  readonly name: string
  readonly category?: string

  readonly acquisitionCost?: Money
  readonly acquisitionDate?: LocalDate

  readonly includedInCapital: boolean
  readonly enabled: boolean
}
```

Examples:

    Dive watch          watch
    Designer bag        bag

A physical asset's contribution to capital is its **estimated resale value**,
recorded as a dated valuation (§71).

This value is an estimate and MUST be presented as one. It carries the same
uncertainty semantics as an estimated `TaxLiability` (§26). Delta MUST NOT
render an estimated resale value with the same authority as a bank balance.

V1 does not model depreciation. Resale value changes only when the user records
a new valuation.

---

# 71. Balance Snapshots — Generalises §15

`SavingsSnapshot` is generalised to a dated valuation against one holding:

```ts
interface BalanceSnapshot {
  readonly id: BalanceSnapshotId
  readonly holdingId: HoldingId

  readonly date: LocalDate
  readonly amount: Money

  readonly basis: "actual" | "estimated"
}
```

A bank account's snapshots are `actual`. A physical asset's are `estimated`.

§2.3 is unchanged and now applies per holding: the latest recorded snapshot for
a holding is the source of truth for that holding, and projections recalculate
from it.

A household with one bank account and no assets behaves exactly as the original
single-savings model did.

---

# 72. Inclusion in Capital

Every holding carries `includedInCapital`.

Excluding a holding removes its value from total capital and from the
projection's starting balance, without deleting it or its history.

This answers questions such as:

    How far are we if we don't count the watches?

    How far are we counting only the joint account?

The flag is persistent user configuration, not a transient filter. A scenario
(§35) may override it temporarily.

Excluded holdings remain visible, visibly inert, and contribute nothing.

---

# 73. Capital and the Projection

The ProjectionEngine is unchanged.

Capital enters as the starting balance only:

    StartingCapital
    = Σ latest included holding valuations

    Savings(M)
    = Savings(M - 1) + NetCashFlow(M)

    Savings(0)
    = StartingCapital

Monthly net cash flow accumulates on top of total capital. Delta does NOT model
which account receives the money — only the total matters to the goal.

Illiquid assets counted toward a liquid goal are the user's judgement, not
Delta's. The inclusion flag (§72) exists so that judgement is explicit.

---

# 74. Capital UI

Capital is its own navigation section.

It lists holdings grouped by kind, each with its latest valuation, an inclusion
toggle, and the date it was last updated.

It shows the composed total, and how that total changes as holdings are toggled.

Physical asset valuations must be visually marked as estimates.

The primary recurring action of §16 becomes **Update balances** — one form
capable of updating several holdings in a single pass, rather than one figure.

---

# 75. Capital Scenario Overrides — Extends §35

Scenario overrides gain:

    IncludeHolding
    ExcludeHolding
    ChangeHoldingValue

Enabling:

    What if we sold the watches?

    What if the bag fetches €6,500 rather than €5,000?

---

# 76. Amendments to Earlier Sections

The following supersede the sections named.

| Section | Superseded by |
|---|---|
| §3 — Tauri / desktop first | Browser-first React SPA; desktop packaging deferred. See `architecture.md`. |
| §15 — SavingsSnapshot | §71 BalanceSnapshot, scoped per holding. |
| §16 — Update savings | §74 Update balances, multi-holding. |
| §52 — `*Repository` port names | Intent-named ports. See `architecture.md`. |
| §59 — Four navigation sections | Six: Dashboard · Projection · Capital · Commitments · Scenarios · Settings. |

---

# 77. Capital, Debt and Net Worth

Delta carries two distinct figures. They are not interchangeable.

**Capital toward goal** — the projection's starting balance.

    Capital
    = Σ latest included holding valuations

**Net worth** — the honest present position.

    NetWorth
    = Capital − Σ outstanding debt balances

They differ by exactly what is still owed, and converge as debts clear.

## Prohibition

The ProjectionEngine MUST NOT subtract outstanding debt from starting capital.

Debt already enters the projection as scheduled future cash flows (§22). Subtracting
the outstanding balance as well counts it twice, understating the trajectory by the
full amount owed and pushing the target date further out than reality.

    Correct     StartingCapital = Σ holdings
    Wrong       StartingCapital = Σ holdings − Σ debt

Net worth is a **derived display figure only**. It never feeds the engine.

## Financed assets

An asset may be acquired on credit. It then appears twice, correctly:

- in `capital`, at its resale value
- in `commitments`, as a `Debt` with its remaining balance and payments

No special handling is required. A €9,000 asset bought on 24 × €375 and carried at a
€11,000 resale value produces the right trajectory automatically: the value sits in the
starting balance, the payments arrive as cash flows.

V1 does not link an asset to the debt that financed it. If several financed assets make
it necessary to know which holding is encumbered, `PhysicalAsset.financedBy?: CommitmentId`
is the intended extension — a weak reference by id, resolved in a read model, so `capital`
never depends on `commitments`.

---

# 78. Asset Valuation Basis

A physical asset's recorded value is its **net realisable proceeds** — what the household
would actually receive — not a listing price, and not the purchase price.

Deduct expected platform fees, dealer margin, or negotiation.

Unrealised gain is NOT modelled. An asset bought for €9,000 and carried at €11,000
expresses its gain through the valuation itself; Delta requires no separate concept, and
must not present one. The €9,000 is sunk and, where financed, partly still owed.

`acquisitionCost` (§70) is informational only. It never enters capital or the projection.

---

# 79. Selling an Asset

Selling converts an illiquid holding into cash, and where financed, settles a debt.

Capital falls by the outstanding balance; net worth is unchanged. This is correct and
must not be presented as a loss.

The effect on the target date is rarely intuitive and must always be computed rather
than assumed — §36 applies. Surrendering capital to remove a monthly payment can move
the goal in either direction depending on the payback period against the remaining
horizon.

V1 handles a sale manually: exclude or delete the holding, record the cash, and update
the debt. A `SellHolding` scenario override is a candidate for V2.
