import { useId } from "react"

import type { InputHTMLAttributes, ReactNode } from "react"

export interface FieldProps {
  readonly label: string
  /** Rendered beneath, and wired to the control with aria-describedby. */
  readonly hint?: string
  readonly error?: string
  readonly children: (ids: { readonly id: string; readonly describedBy?: string }) => ReactNode
}

/**
 * Label, control and message as one unit, so no screen has to remember to wire
 * `htmlFor` and `aria-describedby`. The control arrives as a function of its
 * ids rather than as a child, which is what makes that wiring impossible to
 * forget.
 */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [
    hint === undefined ? undefined : hintId,
    error === undefined ? undefined : errorId
  ]
    .filter((value) => value !== undefined)
    .join(" ")

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-medium">
        {label}
      </label>
      {children({ id, ...(describedBy === "" ? {} : { describedBy }) })}
      {hint === undefined ? null : (
        <p id={hintId} className="text-muted text-xs">
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p id={errorId} className="text-negative text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  )
}

export interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id"
> {
  readonly id: string
  readonly describedBy?: string
  readonly invalid?: boolean
}

export function TextInput({ id, describedBy, invalid, ...rest }: TextInputProps) {
  return (
    <input
      id={id}
      aria-describedby={describedBy}
      aria-invalid={invalid === true ? true : undefined}
      /*
        `w-full min-w-0`: an input carries an intrinsic width of about twenty
        characters, which a grid track will not shrink below. Without this the
        control keeps that width and spills out of any container narrower than
        it — which is how a dialog's fields ended up outside the dialog.
      */
      className={`bg-surface text-ink w-full min-w-0 rounded-md border px-3 py-1.5 text-sm ${
        invalid === true ? "border-negative" : "border-line"
      }`}
      {...rest}
    />
  )
}
