/**
 * How deep a callback may sit.
 *
 * `max-lines-per-function` measures how much a function does; this measures how
 * far in it does it. The two come apart in Effect code, where a body stays
 * short while the pipeline it is written in nests: a generator inside a
 * combinator's callback inside another generator reads as one thing and is
 * three scopes, each closing over the last.
 */

// The same mutable-tuple shape as the size budgets, for the same reason.
type NestingRule = ["error", { max: number }]

/**
 * Four, because three is the architecture rather than a choice a feature makes.
 *
 * A use case spends `Effect.gen` → a combinator's callback → `Effect.gen` on its
 * shape before any of its own logic appears. So 4 admits the structural three
 * plus a lambda, and reports the fifth level — where a callback stops being a
 * one-liner handed to a combinator and becomes a second procedure with its own
 * statements. The fix is always the same and always available: name it and lift
 * it out.
 */
export const nestingBudget: { "max-nested-callbacks": NestingRule } = {
  "max-nested-callbacks": ["error", { max: 4 }]
}
