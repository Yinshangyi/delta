import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ButtonTone = "primary" | "secondary" | "ghost"

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  readonly tone?: ButtonTone
  readonly children: ReactNode
}

/**
 * Exactly one primary button should be obvious on a screen (design-brief.md,
 * principle 4). The tones are ranked, not decorative — reaching for `primary`
 * twice on one screen is the signal that something is wrong with the screen.
 */
const TONES: Record<ButtonTone, string> = {
  primary: "bg-accent text-accent-ink hover:opacity-90",
  secondary: "bg-surface text-ink border-line border hover:bg-raised",
  ghost: "text-muted hover:text-ink hover:bg-raised"
}

export function Button({ tone = "secondary", type = "button", children, ...rest }: ButtonProps) {
  return (
    <button
      // oxlint-disable-next-line react/button-has-type
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone]}`}
      {...rest}
    >
      {children}
    </button>
  )
}
