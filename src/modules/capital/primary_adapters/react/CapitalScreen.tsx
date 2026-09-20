import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"

import type { ReactNode } from "react"

export interface CapitalScreenProps {
  readonly headline: ReactNode
  readonly groups: ReactNode
  readonly detail: ReactNode
}

export function CapitalScreen({ headline, groups, detail }: CapitalScreenProps) {
  const copy = CAPITAL_COPY

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted text-sm">{copy.description}</p>
      </header>

      {headline}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">{groups}</div>
        <div className="min-w-0">{detail}</div>
      </div>
    </div>
  )
}
