import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type * as Money from "@/shared/domain/Money"

export interface CapitalFooterProps {
  readonly total: Money.Money
  readonly accounts: number
  readonly assets: number
}

/** Props in, JSX out. The figure is read by the container (APP-02). */
export function CapitalFooter({ total, accounts, assets }: CapitalFooterProps) {
  const copy = DASHBOARD_COPY.capitalCard

  return (
    <div className="flex flex-col gap-1">
      <p className="eyebrow">{copy.eyebrow}</p>
      <p className="text-ink text-lg font-semibold tabular-nums">{MoneyText.money(total)}</p>
      <p className="text-muted text-xs">
        {accounts} {accounts === 1 ? copy.account : copy.accounts} · {assets}{" "}
        {assets === 1 ? copy.asset : copy.assets}
      </p>
    </div>
  )
}
