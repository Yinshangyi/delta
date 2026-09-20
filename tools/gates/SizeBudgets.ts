/**
 * Size budgets for the app's source.
 *
 * Nothing else in the chain measures a file absolutely. A review looks at a
 * diff, which is right for a review and blind to how files actually go bad:
 * twenty lines a change across a dozen changes that each read clean. The
 * budgets hold from the first commit, so there is no backlog of files that
 * predate them and no exemption list to maintain.
 */

// A mutable tuple rather than `as const`: oxlint's `defineConfig` types a rule entry as
// `[AllowWarnDeny, ...unknown[]]`, and a readonly tuple is not assignable to it.
type BudgetRule = ["error", { max: number; skipBlankLines?: boolean; skipComments?: boolean }]

/**
 * What a source file may be.
 *
 * `skipBlankLines` and `skipComments` are false on purpose: comments carry the
 * reasoning a reader needs, and a budget that stopped counting them would
 * reward moving an argument out of the file it belongs to.
 */
export const sizeBudgets: {
  "max-lines": BudgetRule
  "max-lines-per-function": BudgetRule
} = {
  "max-lines": ["error", { max: 200, skipBlankLines: false, skipComments: false }],
  "max-lines-per-function": ["error", { max: 40 }]
}

/**
 * What a component file may be: 400 lines, and no budget per function.
 *
 * A component is one function whose length is mostly markup, and a flat tree of
 * elements reads the same at 40 lines as at 250 — so the function budget
 * measures the wrong thing there, and the file budget is raised rather than
 * dropped.
 */
export const componentSizeBudgets: { "max-lines": BudgetRule } = {
  "max-lines": ["error", { max: 400, skipBlankLines: false, skipComments: false }]
}

export const componentScope = ["src/**/*.tsx"] as const

/**
 * What the budgets apply to: the app's own source. `tools/**` and the root
 * configs are outside, because a gate or a config is read once, when it is
 * written, and the arguments in it are the point.
 */
export const sizeBudgetScope = ["src/**/*.{ts,tsx}"] as const

/**
 * Where a line budget measures the wrong thing. A test's arrange block is
 * self-sufficient by design, so a long test file is the rule being obeyed
 * rather than broken.
 */
export const exemptFromSizeBudgets = ["**/*.test.{ts,tsx}"] as const
