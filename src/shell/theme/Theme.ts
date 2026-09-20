/**
 * Theme preference, held outside React so the pre-paint script in index.html
 * and the app agree on one source of truth.
 *
 * The preference is per-device, not per-household, so it lives in localStorage
 * rather than the database — and reading it must not wait on a worker, or the
 * first paint is the wrong colour.
 *
 * The three browser capabilities it needs arrive as a `ThemeEnvironment` rather
 * than being reached for. That is dependency inversion without Effect: the
 * calling convention here is React's `useSyncExternalStore`, which demands a
 * synchronous read, so there is nowhere for an `Effect` description to travel
 * to. What it buys is the same thing a Layer would — a test substitutes a whole
 * environment instead of monkey-patching globals.
 */
export type ThemePreference = "system" | "light" | "dark"

export type Theme = "light" | "dark"

export const STORAGE_KEY = "delta.theme"

/** Only what the store actually uses, so a test fake needs no cast. */
export interface DarkMediaQuery {
  readonly matches: boolean
  readonly addEventListener: (type: "change", listener: () => void) => void
  readonly removeEventListener: (type: "change", listener: () => void) => void
}

export interface ThemeEnvironment {
  /** Absent in a browser with no storage at all, as opposed to one that refuses. */
  readonly storage: Pick<Storage, "getItem" | "setItem"> | undefined
  readonly darkMedia: DarkMediaQuery | undefined
  readonly writeTheme: (theme: Theme) => void
}

export interface ThemeStore {
  readonly preference: () => ThemePreference
  readonly theme: () => Theme
  readonly set: (preference: ThemePreference) => void
  readonly subscribe: (listener: () => void) => () => void
}

const isPreference = (value: unknown): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark"

export const browserEnvironment: ThemeEnvironment = {
  storage: globalThis.localStorage as Storage | undefined,
  darkMedia: globalThis.matchMedia?.("(prefers-color-scheme: dark)"),
  writeTheme: (theme) => {
    document.documentElement.dataset["theme"] = theme
  }
}

/** Read once at construction; see `current` below for why it is not read again. */
const storedIn = (environment: ThemeEnvironment): ThemePreference => {
  try {
    const value = environment.storage?.getItem(STORAGE_KEY)
    return isPreference(value) ? value : "system"
    // Private browsing and blocked site data throw rather than return null,
    // and there is one sane answer either way: follow the system.
    // ast-grep-ignore: no-unbound-catch
  } catch {
    return "system"
  }
}

const resolved = (environment: ThemeEnvironment, preference: ThemePreference): Theme => {
  if (preference !== "system") return preference
  return environment.darkMedia?.matches === true ? "dark" : "light"
}

const persist = (environment: ThemeEnvironment, preference: ThemePreference): void => {
  try {
    environment.storage?.setItem(STORAGE_KEY, preference)
    // A refused write costs the choice on the next reload, nothing more.
    // ast-grep-ignore: no-unbound-catch
  } catch {
    // Deliberately empty: the choice still holds for this session.
  }
}

/**
 * Notifies on an explicit change, and on the system flipping under "system" —
 * where the theme must be repainted even though the preference did not move.
 */
const subscriber =
  (environment: ThemeEnvironment, listeners: Set<() => void>, paint: () => void) =>
  (listener: () => void): (() => void) => {
    listeners.add(listener)
    const onSystemChange = () => {
      paint()
      listener()
    }
    environment.darkMedia?.addEventListener("change", onSystemChange)

    return () => {
      listeners.delete(listener)
      environment.darkMedia?.removeEventListener("change", onSystemChange)
    }
  }

export const makeThemeStore = (environment: ThemeEnvironment = browserEnvironment): ThemeStore => {
  const listeners = new Set<() => void>()

  /**
   * Read once, then held in memory. Storage is where the choice persists, not
   * where it lives: a refused write must still hold for this session, and
   * `useSyncExternalStore` calls the snapshot on every render, which is no
   * place for a storage hit.
   */
  let current: ThemePreference = storedIn(environment)

  const preference = (): ThemePreference => current

  const theme = (): Theme => resolved(environment, current)

  /** The only place the resolved theme reaches the outside world. */
  const paint = (): void => environment.writeTheme(theme())

  const set = (next: ThemePreference): void => {
    current = next
    persist(environment, next)
    paint()
    for (const listener of listeners) listener()
  }

  return { preference, theme, set, subscribe: subscriber(environment, listeners, paint) }
}

/** The instance the application uses. Tests build their own. */
export const themeStore: ThemeStore = makeThemeStore()
