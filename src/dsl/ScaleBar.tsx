export interface ScaleBarProps {
  readonly percent: number
  readonly label: string
  /** The two ends of the scale, as text. The DSL never formats money itself. */
  readonly start: string
  readonly end: string
}

/**
 * A progress bar that names what it is measured against.
 *
 * An unlabelled bar states a ratio and hides both of its terms — the reader
 * can see a third of something without being told a third of what. Naming the
 * ends turns it into an axis, which is the same job the chart's goal line
 * does, and it is where a goal figure belongs: the goal *is* the right edge.
 */
export function ScaleBar({ percent, label, start, end }: ScaleBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="bg-raised h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="bg-accent h-full" style={{ width: `${percent}%` }} />
      </div>

      <p className="flex items-baseline justify-between gap-3">
        <span className="text-muted text-xs tabular-nums">{start}</span>
        <span className="text-ink text-base font-medium tabular-nums">{end}</span>
      </p>
    </div>
  )
}
