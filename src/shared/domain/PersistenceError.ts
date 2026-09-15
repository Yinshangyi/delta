/**
 * The one error an adapter is allowed to give `core` (spec §54).
 *
 * A `SqlError` carries the statement, the driver's code and sometimes the
 * values that were bound to it — which for Delta means the household's
 * balances. Letting it through would put SQL in the domain's error channel and
 * financial figures in a log line, and would make every use case's failure type
 * change when the database does.
 */
import { Data } from "effect"

export class PersistenceError extends Data.TaggedError("PersistenceError")<{
  readonly operation: string
  readonly cause: unknown
}> {}

/**
 * `cause` is kept for a developer looking at a stack trace, never for display.
 * `operation` is the domain-language name of what failed — "load holdings",
 * not the statement that failed to run.
 */
export const wrap =
  (operation: string) =>
  (cause: unknown): PersistenceError =>
    new PersistenceError({ operation, cause })
