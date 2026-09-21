import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"
import * as Money from "@/shared/domain/Money"
import * as MoneyText from "@/shared/presentation/MoneyText"

export interface UnreachableNoticeProps {
  readonly shortfall: { readonly monthly: Money.Money; readonly reason: string }
}

/**
 * TRJ-09: the screen still answers rather than erroring. It says what the
 * household is actually putting aside, and points at the thing that would
 * change it — a target date that cannot be computed is information, not a
 * failure.
 *
 * It replaces the date in the header rather than annotating it: there is no
 * date to qualify.
 */
export function UnreachableNotice({ shortfall }: UnreachableNoticeProps) {
  const copy = DASHBOARD_COPY.unreachable

  return (
    <>
      <p className="text-ink text-2xl font-semibold tracking-tight">{copy.title}</p>
      <p className="text-muted text-sm">
        {Money.isNegative(shortfall.monthly) ? copy.shortfallNegative : copy.shortfall}{" "}
        <span className="text-ink font-medium tabular-nums">
          {MoneyText.money(Money.abs(shortfall.monthly))}
        </span>{" "}
        {copy.aMonth}, {shortfall.reason}
      </p>
      <p className="text-muted text-sm">{copy.suggestion}</p>
    </>
  )
}
