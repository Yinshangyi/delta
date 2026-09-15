import { useEffect, useRef } from "react"

import type { ReactNode } from "react"

export interface DialogProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly title: string
  readonly children: ReactNode
  /** Buttons, right-aligned. The primary action goes last. */
  readonly actions?: ReactNode
}

/**
 * The native `<dialog>`, opened with `showModal()`. Focus trapping, Escape,
 * the top layer, `inert` on everything behind it and the backdrop are the
 * browser's, which is several hundred lines nobody has to maintain — and the
 * accessibility is correct by construction rather than by review.
 *
 * Scroll lock is the one thing it does not do, so that is here.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  /**
   * Listened for directly rather than through React's `onClose`. `close` does
   * not bubble, so it sits outside the delegated event system — and this one
   * listener covers every way out: Escape, the backdrop, and `close()`, since
   * an un-prevented `cancel` is always followed by `close`.
   */
  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) return
    dialog.addEventListener("close", onClose)
    return () => dialog.removeEventListener("close", onClose)
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = overflow
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className="bg-surface text-ink border-line m-auto w-full max-w-md rounded-lg border p-6 backdrop:bg-black/40"
    >
      <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 text-sm">{children}</div>
      {actions === undefined ? null : <div className="mt-6 flex justify-end gap-2">{actions}</div>}
    </dialog>
  )
}
