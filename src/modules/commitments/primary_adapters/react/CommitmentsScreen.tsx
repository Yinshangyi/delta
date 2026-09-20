import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"

import type { ReactNode } from "react"

export interface CommitmentsScreenProps {
  readonly list: ReactNode
  readonly detail: ReactNode
}

/**
 * List and detail side by side on a wide screen, stacked on a narrow one
 * (spec §28). The detail column never collapses — it holds the totals when
 * nothing is selected (CMT-12).
 */
export function CommitmentsScreen({ list, detail }: CommitmentsScreenProps) {
  const copy = COMMITMENTS_COPY

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted text-sm">{copy.description}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">{list}</div>
        <div className="min-w-0">{detail}</div>
      </div>
    </div>
  )
}
