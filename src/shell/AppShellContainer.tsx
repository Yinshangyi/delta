import { CapitalContainer } from "@/modules/capital/primary_adapters/react/CapitalContainer"
import { CommitmentsContainer } from "@/modules/commitments/primary_adapters/react/CommitmentsContainer"
import { WithHousehold } from "@/modules/household/primary_adapters/react/WithHousehold"
import { ScenariosContainer } from "@/modules/scenarios/primary_adapters/react/ScenariosContainer"
import { DashboardContainer } from "@/modules/trajectory/primary_adapters/react/DashboardContainer"
import { ProjectionContainer } from "@/modules/trajectory/primary_adapters/react/ProjectionContainer"
import { AppShell } from "@/shell/AppShell"
import { CapitalFooterContainer } from "@/shell/CapitalFooterContainer"
import { useSection } from "@/shell/routing/useSection"
import { SettingsContainer } from "@/shell/settings/SettingsContainer"

/**
 * All six sections are built, so there is no section-level empty state left to
 * fall back to — a screen with nothing on it says so in its own words, beside
 * the button that fills it (SHL-06).
 *
 * Commitments is one section for expenses, debt and tax together, which spec
 * §28 is explicit about; Capital is where the inclusion question is asked,
 * with the target date in view while it is being asked (spec §74); Projection
 * is the dashboard's chart at full size with the month-by-month table under
 * it; and Scenarios is where a change is tried before it is made.
 */
export function AppShellContainer() {
  const section = useSection()

  return (
    <AppShell current={section} footer={<CapitalFooterContainer />}>
      {section === "settings" ? (
        <SettingsContainer />
      ) : (
        <WithHousehold>
          {(household) => {
            switch (section) {
              case "dashboard":
                return <DashboardContainer />
              case "projection":
                return <ProjectionContainer />
              case "capital":
                return <CapitalContainer household={household} />
              case "commitments":
                return <CommitmentsContainer household={household} />
              case "scenarios":
                return <ScenariosContainer household={household} />
            }
          }}
        </WithHousehold>
      )}
    </AppShell>
  )
}
