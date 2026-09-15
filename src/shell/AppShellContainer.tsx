import { EmptyState } from "@/dsl/EmptyState"
import { AppShell } from "@/shell/AppShell"
import { titleOf } from "@/shell/routing/Section"
import { useSection } from "@/shell/routing/useSection"
import { EMPTY_STATES } from "@/shell/SectionVocabulary"
import { useTheme } from "@/shell/theme/useTheme"
import { ThemeControl } from "@/shell/ThemeControl"

/**
 * Every section is empty until its own epic fills it, so every section shows
 * its empty state. That is not a placeholder — it is what these screens will
 * show on a brand-new household anyway, and building it now means the first
 * run is designed rather than discovered.
 *
 * The primary action each one offers arrives with the ticket that can perform
 * it: CAP-03 for a holding, CMT-02 for a commitment, SCN-02 for a scenario.
 */
export function AppShellContainer() {
  const section = useSection()
  const { preference, setPreference } = useTheme()
  const copy = EMPTY_STATES[section]

  return (
    <AppShell
      current={section}
      aside={<ThemeControl preference={preference} onChange={setPreference} />}
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">{titleOf(section)}</h1>
        <EmptyState title={copy.title} description={copy.description} />
      </div>
    </AppShell>
  )
}
