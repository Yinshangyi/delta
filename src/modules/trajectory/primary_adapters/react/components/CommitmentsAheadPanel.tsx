import { DASHBOARD_COPY } from "@/modules/trajectory/primary_adapters/react/TrajectoryVocabulary"

export interface CommitmentAhead {
  readonly id: string
  readonly name: string
  readonly headline: string
  readonly detail: string | undefined
}

export interface CommitmentsAheadPanelProps {
  readonly commitments: ReadonlyArray<CommitmentAhead>
}

/**
 * The commitments that end (TRJ-06): a debt clears, a tax schedule runs out.
 * They are worth their own heading because they are the ones whose shape
 * changes the trajectory — the rent does not.
 *
 * An empty case rather than an absent panel: a household with no debt should
 * read that as the good news it is, not as a section that failed to load.
 */
export function CommitmentsAheadPanel({ commitments }: CommitmentsAheadPanelProps) {
  const copy = DASHBOARD_COPY.commitmentsAhead

  return (
    <section className="border-line bg-surface flex flex-col gap-3 rounded-lg border p-5">
      <h2 className="text-ink text-sm font-semibold">{copy.title}</h2>

      {commitments.length === 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-ink text-sm">{copy.empty}</p>
          <p className="text-muted text-xs">{copy.emptyNote}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {commitments.map((commitment) => (
            <li key={commitment.id} className="flex flex-col gap-0.5">
              <span className="text-ink text-sm font-medium">{commitment.name}</span>
              <span className="text-ink text-sm tabular-nums">{commitment.headline}</span>
              {commitment.detail === undefined ? null : (
                <span className="text-muted text-xs">{commitment.detail}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
