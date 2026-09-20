/**
 * Every table a backup carries, named once (DAT-01).
 *
 * A list rather than "whatever the database happens to hold", because the
 * failure worth preventing is silent: a table added in a later migration and
 * forgotten here would export cleanly, import cleanly, and lose the
 * household's data without a word. `BackupCompleteness` is the test that turns
 * that omission into a failing build.
 *
 * Order matters on the way in: a row referencing another must be written after
 * it, and foreign keys are enforced (see ForeignKeys.ts).
 */
export const BACKUP_TABLES = [
  "households",
  "people",
  "income_sources",
  "billable_day_overrides",
  "commitments",
  "scheduled_payments",
  "debt_snapshots",
  "holdings",
  "balance_snapshots",
  "financial_goals",
  "scenarios",
  "scenario_overrides"
] as const

export type BackupTable = (typeof BACKUP_TABLES)[number]

/**
 * Tables that exist but are deliberately not carried.
 *
 * `app_metadata` marks the file as Delta's and `effect_sql_migrations` is the
 * migrator's own bookkeeping — restoring either from a backup would overwrite
 * the state of the database being restored *into*, which is the one thing an
 * import must not touch.
 */
export const NOT_BACKED_UP = ["app_metadata", "effect_sql_migrations"] as const
