/** Copy as data (architecture.md — React), so it is reviewable in one place. */
export const SETTINGS_COPY = {
  household: {
    title: "Household",
    description: "Who is in it, what each of them earns, and what it is called."
  },
  goal: {
    title: "Goal",
    description: "The amount the projection runs toward, and whether it is running."
  },
  backup: {
    title: "Backup",
    description: "A copy you keep, somewhere the browser cannot reach.",
    /** Spec §2.2: hand-entered data with nothing upstream to restore it from. */
    exportNote:
      "One file with everything: people, income, commitments, holdings, valuations, the goal and every scenario. It is written to your downloads and sent nowhere.",
    export: "Save a backup",
    lastExported: "Last saved",
    never: "Never saved on this device.",
    importTitle: "Restore from a backup",
    importNote:
      "Restoring replaces everything Delta currently holds on this device. You will see what is in the file before anything is written.",
    choose: "Choose a file…",
    reading: "Read a backup saved on",
    restore: {
      title: "Replace everything with this backup?",
      note: "Everything Delta currently holds on this device is deleted and replaced. There is no undo.",
      exportedOn: "This file was saved on",
      willReplace: "What changes",
      confirm: "Replace everything",
      cancel: "Cancel",
      nothingThere: "nothing"
    },
    failed: {
      "not-json": "That file is not a Delta backup — it is not even JSON.",
      "not-a-delta-backup": "That file is JSON, but it is not a Delta backup.",
      "unsupported-version":
        "That backup was written by a newer version of Delta than this one can read.",
      "missing-tables": "That backup is missing part of its contents."
    }
  },
  appearance: {
    title: "Appearance",
    description: "Follow the system, or pick a theme for this device."
  },
  storage: {
    title: "Storage",
    description: "Where Delta keeps your data, and whether the browser will hold on to it.",
    persistent: "Marked persistent. The browser will not evict it to reclaim space.",
    /**
     * Spec §2.2 and FND-11: hand-entered data with nothing upstream to restore
     * it from. If the browser will not promise to keep it, say so plainly and
     * point at the thing that actually protects them.
     */
    notPersistent:
      "Not marked persistent. The browser may delete this data if it runs short of space — keep an export.",
    unknown: "This browser does not report how much space it is using.",
    checking: "Checking storage…",
    failed: "Could not read the storage state.",
    failedDetail: "Your data is unaffected. Reloading usually clears this."
  }
} as const
