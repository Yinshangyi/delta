# Delta — UI design brief

> Prompt for a UI mock. Self-contained: everything needed is below.

---

## What Delta is

A private, local-first financial projection app for a household. Not a budgeting app, not
an accounting tool, not a bank aggregator. It never sees a bank account — the user enters
what they earn, what they're committed to paying, and what they've actually saved.

It exists to answer one question:

> **Given our current trajectory, when do we reach our goal?**

And its defining behaviour is translating money into **time**:

- Daily rate €600 → €700 · *goal arrives 3 months sooner*
- An €11,500 purchase · *goal slips 2 months*
- Savings €1,500 below forecast · *goal slips 3 weeks*

Design everything around that. A number on its own is worth less than the same number
expressed as a change in the target date.

---

## Design principles

**1. Time-to-goal is the hero.** The estimated target date is the most important element
on the screen. Currency totals support it; they don't compete with it.

**2. Actual and forecast must never be confused.** Recorded history is fact. Everything
after today is an estimate. This distinction needs a consistent visual language — solid
versus dashed, saturated versus muted — applied identically in the chart, in tables, and
on cards.

**3. Estimates must not look like certainties.** A confirmed tax bill of €21,215 and an
estimated one of ~€14,000 must be visually distinguishable at a glance. Never render an
estimate with the same authority as a known amount.

**4. One primary action.** The recurring user journey is: open app → update actual savings
→ see the new target date. Everything else is configuration. Exactly one primary button
should be obvious on the dashboard.

**5. Distinctions must survive colour-blindness.** Principles 2 and 3 both depend on the
user telling two things apart. Neither may rely on hue alone — pair colour with line style,
weight, a label, an icon, or a fill pattern. Aim for WCAG AA contrast in both themes.

**6. No accounting burden.** The user never enters a transaction. Nothing in the UI should
imply they're expected to reconcile anything.

---

## Platform & tone

- Desktop web app, macOS-first. Design at 1440×900; it should hold up at 1024 wide.
- Light and dark themes.
- Calm, precise, private. Closer to a well-made native utility than to a fintech dashboard.
  No gamification, no celebratory confetti, no stock photography.
- Money is serious and sometimes unwelcome news. Read "€1,500 behind plan" as information,
  not as failure — the tone should stay level.
- Tabular figures for all currency. Alignment matters more than decoration.

---

## Navigation

Six sections, and no more:

```
Dashboard · Projection · Capital · Commitments · Scenarios · Settings
```

*The nav mirrors the domain: what you have (Capital), what you owe (Commitments),
where you're going (Projection), what if (Scenarios).*

*Scenarios is a deliberate departure from spec §59, which lists four. Simulation is a
headline feature (§34–36) and needs a home; a modal reachable from nowhere isn't one.*

Explicitly **do not** add nav sections for Transactions, Accounts, Taxes, Debt, Budgets,
Salary, or Freelance. Taxes and debt live inside Commitments.

---

## Screens

### 1. Dashboard

Strict hierarchy, top to bottom:

**a. The headline.** Total capital against the goal, the percentage reached, and
dominating the composition. Capital is now a composed figure — the headline shows the
total, with its composition one click away:

```
€28,000   of €150,000
3 accounts · 2 assets · 17% reached
```

Where debts exist, net worth sits beneath it as a second, quieter figure:

```
Capital       €33,000
Owed          −€7,800
Net worth     €25,200
```

Capital is the headline because it drives the target date. Net worth is the honest present
position. They differ by exactly what is still owed and converge as debts clear — so on a
debt-free household the second block disappears rather than showing a redundant duplicate.

```
Estimated target      October 2028
25 months remaining
```

**b. Current trajectory.** Three figures: household income, commitments, expected monthly
savings. Compact — this is context, not the point.

**c. The projection chart.** See below.

**d. Active commitments worth surfacing.** Typically a debt with its progress, and the next
tax payment due.

**e. The primary action:** `Update savings`.

### 2. Projection chart

The centrepiece.

- X axis: time. Y axis: household savings.
- A solid line for **actual** recorded savings, ending at today.
- A visually distinct line for **forecast** savings continuing from that point.
- A horizontal goal line at the target amount.
- The intersection of forecast and goal clearly marked — this is the answer to the user's
  question and should read as the chart's focal point.

The Projection screen shows the same chart larger, plus a month-by-month table: starting
savings, income, commitments, net cash flow, ending savings. Past months marked as actual,
future months as forecast.

### 3. Capital

What the household owns, and what counts toward the goal.

**Grouped by kind, because they behave differently:**

```
ACCOUNTS                                         included

  Joint current account      €9,900   3 Nov      ●
  Emergency fund              €12,000  31 Oct     ●
  Sam business reserve         €5,800  31 Oct     ○

ASSETS                             estimated resale

  Dive watch            ~€7,100   valued Sep 2026  ●
  Designer bag             ~€5,000   valued Jun 2026  ○

TOTAL CAPITAL              €28,000
of €150,000 · 17%
```

**The toggles are the point of this screen.** Flipping one recomputes the total *and* the
target date, live, in place. That is the question the screen exists to answer — *how far
are we if we don't count the watches?* — so the target date must be visible while toggling,
not a page away.

Excluded holdings stay in the list, visibly inert, with their value struck or muted. They
are not deleted and their history survives.

**Asset valuations are estimates and must look like it.** A `~` prefix, the `ESTIMATED`
treatment already used for tax, and a visible valuation date. A watch's resale value must
never render with the same authority as a bank balance — that distinction is the whole
reason the screen separates accounts from assets.

**Value means net proceeds, not listing price.** The form's helper text has to say so. "I
could easily get €11,000" is a listing price; after platform fees or dealer margin the
household receives less, and the projection is only as honest as the number entered.

**Never show purchase price beside resale value as a gain.** An asset bought at €9,000 and
carried at €11,000 has its gain already expressed in the valuation. A "+€2,000 profit"
badge invents a figure that drives nothing, and invites the user to read it as money
available toward the goal.

**Staleness matters more here.** A bank balance from three days ago is fine; an asset
valued eighteen months ago is probably wrong. Show the date, and let old valuations read
as old.

**Per-holding detail** shows its valuation history — the same shape as savings history —
plus edit and delete.

### 4. Commitments

One flat list, mixed types, each with an icon and a type-appropriate summary line:

```
Rent                    €1,280 / month
Family support          €450 / month
Card debt               €7,200 remaining · €900 / month · 8 months left
2025 income tax         €21,215 scheduled          CONFIRMED
2026 tax catch-up       ~€14,000                   ESTIMATED
Vacation                €6,500 · August 2027       one-off

+ Add commitment
```

A **debt** needs a richer detail view: initial versus remaining, a progress bar, percent
repaid, monthly payment, estimated months remaining, estimated payoff date, and a control
to record the actual remaining balance.

A **tax liability** shows its payment schedule as explicit dated rows — amounts differ
(€5,303, €5,303, €5,303, €5,306) and must not be averaged into "≈€5,303/month".

### 5. Scenarios

A section, not a modal — which means scenarios persist, are named, and can be reopened.

**The list.** Saved scenarios with their headline outcome, so the set is scannable without
opening anything:

```
Raise my rate and take a holiday
3 changes · July 2028 · 3 months sooner

Cut the personal budgets
1 change · August 2028 · 2 months sooner

Buy the car in 2027
1 change · January 2029 · 3 months later

+ New scenario
```

Sort by impact, and show direction consistently — sooner and later need distinct treatment
that isn't only colour.

**The builder.** Opens from a row or from `+ New scenario`. It must read as hypothetical
throughout — a persistent banner, and a texture or pattern on the simulated side so the
distinction survives greyscale. Structure:

- A **name** field (the reason it's saveable).
- A **stack of changes**, each removable, added from the five override types: daily rate ·
  billable days · add expense · disable commitment · change income.
- **Current vs simulation side by side**, each with its assumptions, target date, months
  remaining, and a small trajectory chart.
- **The delta as the outcome** — `3 months sooner` — and where possible, decomposed:
  *"Holiday costs 1 month; the rate rise buys 4 back."* That sentence is worth more than
  the number above it.
- Three exits: **Discard**, **Preview on dashboard** (temporary, clearly reversible), and
  **Apply to my real plan** (the only one that mutates anything).

**Comparison.** Two scenarios against each other, not just each against the baseline, is
the natural next question. Worth designing even if V1 ships without it.

### 6. Settings

Household members and their income sources; the financial goal; data export and import.

```
Household

  Sam        Freelance   €600 / day        Edit
  Alex       Employee    €3,100 / month    Edit

  + Add person
```

A freelance income source needs: daily rate, payout ratio (labelled as an **estimate**),
default billable days per month, and per-month overrides (e.g. August 12, December 10).

Data export/import deserves real visual weight, not a buried link — it is the user's only
backup.

---

## Two flows to mock

### Update balances

Trigger from the dashboard's primary action. Now multi-holding — the user updates whatever
has changed in one pass, and skips the rest:

```
Date   [ 31 Oct 2026 ]

  Joint current account    was €9,500   [ €9,900 ]
  Emergency fund           was €12,000   [         ]
  Sam business reserve     was  €5,800   [         ]

  Dive watch               was ~€7,100   [         ]   estimated
  Designer bag                was ~€5,000   [         ]   estimated

                       [ Save ]
```

Blank means unchanged, not zero — that has to be unmistakable. Prior values are shown so
the user is correcting a number rather than recalling one.

The result is the interesting part — design the feedback state:

```
Expected   €29,500
Actual     €28,000
           €1,500 behind plan

Goal moved
October 2028  →  November 2028
```

### Simulate

Lives in the Scenarios section — see Screens above. The flow that matters here is the way
in: besides `+ New scenario`, a user should be able to start a simulation **in context**,
from the thing they're wondering about — a commitment row, an income source, a debt. That
entry point pre-fills the first change and drops them into the builder.

The rule that governs all of it: nothing changes the real plan until the user explicitly
applies it, and until then it must be visually obvious they're looking at a hypothetical.

---

## Forms and editing

Most of Delta's screens are editing screens. They need mocking as much as the dashboard.

### Add holding

A type picker, then a type-specific form:

| Bank account | Physical asset |
|---|---|
| name | name |
| institution *(optional)* | category — watch, bag, … |
| opening balance + date | estimated resale value + valuation date |
| include in capital | acquisition cost and date *(optional)* |
|  | include in capital |

The asset form must make clear the value is **what the household would actually receive**
— not the purchase price, and not a listing price. Users conflate all three. Acquisition
cost is informational and must be visually subordinate, so it is never mistaken for the
figure that counts.

### Add commitment

A type picker first, then a type-specific form. Five types, meaningfully different:

```
What kind of commitment?

  Recurring expense    rent, subscriptions, family support
  One-off expense      a purchase on a known date
  Debt                 tracked balance, progress, payoff date
  Tax liability        confirmed or estimated, with a payment schedule
  Recurring tax        a monthly levy such as PAS
```

| Type | Fields |
|---|---|
| Recurring expense | name · amount · monthly · start date · optional end date |
| One-off expense | name · amount · single date |
| Debt | name · initial amount · interest rate · payment amount · start date |
| Tax liability | name · tax year · **confirmed / estimated** · total · payment schedule |
| Recurring tax | name · amount · start date · optional end date · optional person |

The **tax payment schedule** is the hardest form here: a variable-length list of dated
amounts (25 Sep €5,303 · 26 Oct €5,303 · 26 Nov €5,303 · 28 Dec €5,306), with add and
remove per row. It must not collapse into a single "monthly amount" field.

### Add person and income source

A person is a name plus zero or more income sources. The income-type picker branches:

| Freelance | Salary |
|---|---|
| daily rate | monthly net before tax |
| payout ratio *(labelled an estimate)* | monthly income tax |
| default billable days / month | effective dates |
| per-month billable-day overrides | optional annual gross *(informational)* |
| effective dates | |

**Billable-day overrides** need their own treatment: a default (e.g. 20/month) plus
exceptions for specific months (August 12, December 10). Show which months differ from the
default and let the user clear an override back to it.

### Revalue an asset

The sibling of updating a bank balance, but explicitly an estimate:

```
Dive watch

Current estimate    ~€7,100   valued 12 Sep 2026
New estimate        [ €7,500 ]
Valuation date      [ 14 Sep 2026 ]

                        [ Save ]
```

### Record actual debt balance

The sibling of "update savings", and worth the same care. Reality overrides the forecast:

```
Card debt

Projected remaining   €7,350
Actual remaining      [ €7,200 ]
Date                  [ 31 Dec 2026 ]

                           [ Save ]
```

### Enabled and disabled

Commitments, income sources and goals can each be switched off without being deleted —
useful for "what if we stopped this?" without losing the record. A disabled item stays
visible in its list, visibly inert, and contributes nothing to the projection. Design the
toggle and the disabled row state.

### Deleting

Deleting a person, commitment, goal or snapshot needs a confirmation that says what will
be lost, and what it does to the projection. Deleting a savings snapshot is the most
dangerous action in the app — it rewrites recorded history.


## Formatting conventions

Fix these so mocks stay internally consistent:

- **Currency** — `€1,280` and `€150,000`. No decimals unless cents are non-zero. Tabular
  figures, right-aligned in tables. Negative amounts as `-€1,280`, and never in red as the
  sole signal.
- **Months** — `October 2028` in full for target dates and chart labels.
- **Exact dates** — `31 Oct 2026` for snapshots and scheduled payments.
- **Estimates** — prefix with `~` (`~€14,000`) *and* carry a label. The tilde alone is too
  quiet to carry the meaning.
- **Deltas** — always signed and paired with direction: `3 months sooner`, `2 months later`,
  `€1,500 behind plan`.

---

## States to design

Don't mock only the happy path:

- **Empty, first run** — a brand-new household: no people, no commitments, no snapshots,
  no projection possible yet. What does the dashboard say instead of a target date?
- **Empty, per screen** — no commitments yet; no holdings yet; no scenarios yet.
- **All holdings excluded** — total capital is €0 and the goal is unreachable. A reachable
  edge case, since the toggles make it one click away.
- **Capital exceeds net worth substantially** — a financed asset carried at full resale
  value against a large outstanding debt. The dashboard must not read as though that money
  is available.
- **Goal unreachable** — the trajectory is negative, so there is no target date. This needs
  an honest, non-alarming treatment; it is a real and important answer.
- **Behind plan** — actual savings below forecast, target date slipping.
- **Ahead of plan** — the mirror case.
- **Debt fully repaid** — the progress bar complete, no further payments.
- **Estimated vs confirmed** — shown side by side so the visual distinction is testable.

---

## Sample data

Realistic, fictional. *(Deliberately not the author's real finances — this document may be
pasted into external tools.)*

```
Household     Sam & Alex

Income        Sam    Freelance   €600/day · 20 days · 80% payout  →  ~€9,600/month
              Alex   Salary      €3,100/month net after tax

Commitments   Rent                    €1,280/month
              Sam personal budget     €1,100/month
              Alex personal budget    €1,100/month
              Family support          €800/month
              Card debt               €11,000 initial · €7,200 remaining · €900/month
              2025 income tax         €21,215 confirmed, 4 scheduled payments
              Monthly tax (PAS)       €1,600/month
              2026 tax catch-up       ~€14,000 estimated

Savings       €24,000 (Sep 2026)  →  €28,000 (Oct 2026)
Goal          €150,000
Target        October 2028 · 25 months remaining
```

---

## Out of scope

No bank connections, no transaction lists, no account balances, no categorisation, no
investment portfolios, no mobile layouts, no onboarding wizard, no login screen.
