import { HouseholdGate } from "@/modules/household/primary_adapters/react/HouseholdGate"
import { AppShellContainer } from "@/shell/AppShellContainer"

export function App() {
  return (
    <HouseholdGate>
      <AppShellContainer />
    </HouseholdGate>
  )
}
