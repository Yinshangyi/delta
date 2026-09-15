import type { ReactNode } from "react"

export interface SettingsSectionProps {
  readonly title: string
  readonly description: string
  readonly children: ReactNode
}

/**
 * Settings is a container of separate concerns, not one long form (spec §39,
 * §40), so each section is a titled panel rather than another fieldset in a
 * stack. A person arriving to change one thing should see where it is.
 */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="border-line bg-surface rounded-lg border p-5">
      <h2 className="text-ink text-base font-semibold tracking-tight">{title}</h2>
      <p className="text-muted mt-1 text-sm">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export interface SettingsScreenProps {
  readonly children: ReactNode
}

export function SettingsScreen({ children }: SettingsScreenProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}
