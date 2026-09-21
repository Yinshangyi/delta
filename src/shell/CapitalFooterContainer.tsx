import { useAtomValue } from "@effect/atom-react"

import { capitalOverviewAtom } from "@/modules/capital/primary_adapters/reactivity/CapitalAtoms"
import { valueOrUndefined } from "@/shared/reactivity/AsyncState"
import { CapitalFooter } from "@/shell/CapitalFooter"

/**
 * Reads the same atom the Capital screen reads, so the sidebar can never
 * disagree with the screen it links to (APP-02).
 *
 * Renders nothing until there is something to say. A sidebar is not where a
 * loading state or a failure belongs — the screen beside it already says both,
 * and a second voice saying them is noise.
 */
export function CapitalFooterContainer() {
  const overview = valueOrUndefined(useAtomValue(capitalOverviewAtom))

  if (overview === undefined) return null

  return (
    <CapitalFooter
      total={overview.total}
      accounts={overview.accounts.length}
      assets={overview.assets.length}
    />
  )
}
