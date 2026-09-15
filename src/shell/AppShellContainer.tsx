import { EmptyState } from "@/dsl/EmptyState"
import { AppShell } from "@/shell/AppShell"
import { titleOf } from "@/shell/routing/Section"
import { useSection } from "@/shell/routing/useSection"
import { EMPTY_STATES } from "@/shell/SectionVocabulary"
import { SettingsContainer } from "@/shell/settings/SettingsContainer"

/**
 * Every section is empty until its own epic fills it, so every section shows
 * its empty state — which is what these screens will show on a brand-new
 * household anyway. Settings is the exception: it configures rather than
 * records, so it has something to show from the first run.
 */
export function AppShellContainer() {
  const section = useSection()

  if (section === "settings") {
    return (
      <AppShell current={section}>
        <SettingsContainer />
      </AppShell>
    )
  }

  const copy = EMPTY_STATES[section]

  return (
    <AppShell current={section}>
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">{titleOf(section)}</h1>
        <EmptyState title={copy.title} description={copy.description} />
      </div>
    </AppShell>
  )
}
