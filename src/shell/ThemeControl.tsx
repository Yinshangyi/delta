import type { ThemePreference } from "@/shell/theme/Theme"

export interface ThemeControlProps {
  readonly preference: ThemePreference
  readonly onChange: (preference: ThemePreference) => void
}

const OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
]

/**
 * A radio group rather than a toggle: "system" is a real third choice, not the
 * absence of one, and a two-state switch cannot say "follow my machine".
 */
export function ThemeControl({ preference, onChange }: ThemeControlProps) {
  return (
    <fieldset>
      <legend className="text-muted mb-2 font-mono text-[0.65rem] tracking-[0.15em] uppercase">
        Appearance
      </legend>
      <div className="border-line flex overflow-hidden rounded-md border">
        {OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            className={`flex-1 cursor-pointer px-2 py-1.5 text-center text-xs ${
              preference === value ? "bg-accent text-accent-ink font-semibold" : "text-muted"
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => onChange(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
