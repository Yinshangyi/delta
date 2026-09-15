import type { ReactNode, SelectHTMLAttributes } from "react"

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className" | "id"
> {
  readonly id: string
  readonly describedBy?: string
  readonly children: ReactNode
}

/**
 * The native element. Its keyboard behaviour, type-ahead and mobile picker are
 * things a custom listbox has to reimplement and usually gets wrong, and
 * Delta's restrained look does not need what styling it gives up.
 */
export function Select({ id, describedBy, children, ...rest }: SelectProps) {
  return (
    <select
      id={id}
      aria-describedby={describedBy}
      className="bg-surface text-ink border-line rounded-md border px-3 py-1.5 text-sm"
      {...rest}
    >
      {children}
    </select>
  )
}
