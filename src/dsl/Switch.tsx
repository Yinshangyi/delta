export interface SwitchProps {
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly label: string
  readonly disabled?: boolean
}

/**
 * A checkbox with `role="switch"`, not a div with a click handler: the label,
 * the space key, the focus ring and the announced state all come free.
 *
 * The on-state is muted rather than the accent. These toggles sit in lists of
 * commitments and holdings where a row of saturated switches would shout over
 * the figures, which are the point of the screen.
 */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-[18px]">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="peer sr-only"
      />
      <span className="text-ink text-sm peer-disabled:opacity-50">{label}</span>
      <span
        aria-hidden="true"
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50 ${
          checked ? "bg-muted" : "bg-line"
        }`}
      >
        <span
          className={`bg-surface absolute top-0.5 size-3 rounded-full transition-all ${
            checked ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
    </label>
  )
}
