/**
 * The three questions trajectory asks of the rest of the app, answered.
 *
 * Every one of them adapts another module's use case into a trajectory port.
 * Keeping them here rather than inside `trajectory/secondary_adapters/` is
 * what lets `household`, `commitments` and `capital` stay unaware of each
 * other, and of trajectory.
 */
import { Layer } from "effect"

import { CapitalSourcesLive } from "@/bootstrap/seams/CapitalSourcesLive"
import { CashFlowSourcesLive } from "@/bootstrap/seams/CashFlowSourcesLive"
import { OutstandingDebtLive } from "@/bootstrap/seams/OutstandingDebtLive"

import type { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import type { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import type { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import type { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import type { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import type { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import type { CashFlowSources } from "@/modules/trajectory/core/ports/secondary/CashFlowSources"
import type { OutstandingDebt } from "@/modules/trajectory/core/ports/secondary/OutstandingDebt"

export const seamsLayer: Layer.Layer<
  | typeof CashFlowSources.Identifier
  | typeof CapitalSources.Identifier
  | typeof OutstandingDebt.Identifier,
  never,
  | typeof IncomeSources.Identifier
  | typeof Commitments.Identifier
  | typeof DebtHistory.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier
> = Layer.mergeAll(CashFlowSourcesLive, CapitalSourcesLive, OutstandingDebtLive)
