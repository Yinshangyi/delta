import { EmptyState } from "@/dsl/EmptyState"
import { CommitmentsContainer } from "@/modules/commitments/primary_adapters/react/CommitmentsContainer"
import { WithHousehold } from "@/modules/household/primary_adapters/react/WithHousehold"
import { AppShell } from "@/shell/AppShell"
import { titleOf } from "@/shell/routing/Section"
import { useSection } from "@/shell/routing/useSection"
import { EMPTY_STATES } from "@/shell/SectionVocabulary"
import { SettingsContainer } from "@/shell/settings/SettingsContainer"

/**
 * Sections are empty until their own epic fills them, so the remaining ones
 * show their empty state — which is what those screens will show on a
 * brand-new household anyway.
 *
 * Two are built. Settings configures rather than records, so it has something
 * to show from the first run; and Commitments is one section for expenses,
 * debt and tax together, which spec §28 is explicit about.
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

  if (section === "commitments") {
    return (
      <AppShell current={section}>
        <WithHousehold>
          {(household) => <CommitmentsContainer household={household} />}
        </WithHousehold>
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
