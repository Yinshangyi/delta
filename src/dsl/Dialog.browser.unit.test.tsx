import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"

const open = (onClose: () => void = () => {}) =>
  render(
    <>
      <button type="button">behind</button>
      <Dialog open onClose={onClose} title="Delete holding" actions={<Button>Cancel</Button>}>
        <p>This cannot be undone.</p>
      </Dialog>
    </>
  )

describe("a modal dialog", () => {
  it("is announced with its title", () => {
    open()
    expect(screen.getByRole("dialog", { name: "Delete holding" })).toBeInTheDocument()
  })

  it("is modal, so the browser traps focus and handles escape", () => {
    open()
    const dialog = screen.getByRole("dialog")
    // `:modal` is the platform guarantee: focus containment, inert background
    // and Escape all follow from it. Asserting the flag rather than simulating
    // a tab, because user-event computes its own focus order from the whole
    // document and ignores modality.
    expect(dialog.matches(":modal")).toBe(true)
  })

  it("puts focus inside itself on open", () => {
    open()
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true)
  })

  it("reports every way out through one handler", async () => {
    const onClose = vi.fn<() => void>()
    open(onClose)
    // Escape fires `cancel` then `close`; the backdrop and close() fire `close`.
    // Listening to the last of those covers all three. The event is queued
    // rather than dispatched synchronously, hence the wait.
    ;(screen.getByRole("dialog") as HTMLDialogElement).close()
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it("locks scroll while it is open", () => {
    const { unmount } = open()
    expect(document.body.style.overflow).toBe("hidden")
    unmount()
  })

  it("is absent from the tree when closed", () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Delete holding">
        <p>body</p>
      </Dialog>
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
