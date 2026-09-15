import { useSyncExternalStore } from "react"

import { DEFAULT_SECTION, fromHash, type Section } from "@/shell/routing/Section"

const subscribe = (listener: () => void): (() => void) => {
  globalThis.addEventListener("hashchange", listener)
  return () => globalThis.removeEventListener("hashchange", listener)
}

/**
 * Hash routing rather than the History API, and no router package — six flat
 * sections need neither. The hash also means a reload returns to the same
 * section on any static host, with no server rewrite rules to get wrong.
 */
export const useSection = (): Section =>
  useSyncExternalStore(
    subscribe,
    () => fromHash(globalThis.location.hash),
    () => DEFAULT_SECTION
  )
