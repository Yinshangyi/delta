/** Copy as data (architecture.md — React), so it is reviewable in one place. */
export const SETTINGS_COPY = {
  household: {
    title: "Household",
    description: "Who is in it, what each of them earns, and what it is called."
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
