/**
 * Theme preference, held outside React so the pre-paint script in index.html
 * and the app agree on one source of truth.
 *
 * The preference is per-device, not per-household, so it lives in
 * localStorage rather than the database — and reading it must not wait on a
 * worker, or the first paint is the wrong colour.
 */
export type ThemePreference = "system" | "light" | "dark"

export type Theme = "light" | "dark"

export const STORAGE_KEY = "delta.theme"

const isPreference = (value: unknown): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark"

/** Private browsing and blocked site data both make this throw rather than return null. */
export const readPreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isPreference(stored) ? stored : "system"
    // There is one sane answer to any storage failure, and it is "follow the
    // system" — the cause adds nothing the caller could act on.
    // ast-grep-ignore: no-unbound-catch
  } catch {
    return "system"
  }
}

export const systemTheme = (): Theme =>
  globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"

export const resolve = (preference: ThemePreference): Theme =>
  preference === "system" ? systemTheme() : preference

export const apply = (theme: Theme): void => {
  document.documentElement.dataset["theme"] = theme
}

const listeners = new Set<() => void>()

const announce = (): void => {
  for (const listener of listeners) listener()
}

export const writePreference = (preference: ThemePreference): void => {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
    // A refused write costs the choice on the next reload, nothing more.
    // ast-grep-ignore: no-unbound-catch
  } catch {
    // A refused write is not worth failing over; the choice lasts this session.
  }
  apply(resolve(preference))
  announce()
}

/** Notifies on an explicit change and on the system flipping under "system". */
export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)")
  const onSystemChange = () => {
    if (readPreference() === "system") apply(systemTheme())
    listener()
  }
  media?.addEventListener("change", onSystemChange)

  return () => {
    listeners.delete(listener)
    media?.removeEventListener("change", onSystemChange)
  }
}
