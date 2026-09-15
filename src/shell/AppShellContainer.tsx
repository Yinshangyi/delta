import { AppShell } from "@/shell/AppShell"
import { type Section, titleOf } from "@/shell/routing/Section"
import { useSection } from "@/shell/routing/useSection"
import { SectionPlaceholder } from "@/shell/SectionPlaceholder"
import { useTheme } from "@/shell/theme/useTheme"
import { ThemeControl } from "@/shell/ThemeControl"

const SUMMARIES: Record<Section, { summary: string; ticket: string }> = {
  dashboard: {
    summary: "Total capital against the goal, the estimated target date, and one action.",
    ticket: "TRJ-06"
  },
  projection: {
    summary: "Month by month to the goal, recorded history solid and forecast dashed.",
    ticket: "TRJ-07"
  },
  capital: {
    summary: "Bank accounts and physical assets, and which of them count toward the goal.",
    ticket: "CAP-08"
  },
  commitments: {
    summary: "Everything owed or spent on a schedule — recurring, one-off, debt and tax.",
    ticket: "CMT-11"
  },
  scenarios: {
    summary: "What a change would cost in time, measured against the current trajectory.",
    ticket: "SCN-06"
  },
  settings: {
    summary: "The household, the goal, storage and backup.",
    ticket: "SHL-07"
  }
}

export function AppShellContainer() {
  const section = useSection()
  const { preference, setPreference } = useTheme()
  const { summary, ticket } = SUMMARIES[section]

  return (
    <AppShell
      current={section}
      aside={<ThemeControl preference={preference} onChange={setPreference} />}
    >
      <SectionPlaceholder title={titleOf(section)} summary={summary} ticket={ticket} />
    </AppShell>
  )
}
