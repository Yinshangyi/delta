import { describe, expect, it } from "vitest"

import {
  type DarkMediaQuery,
  makeThemeStore,
  STORAGE_KEY,
  type Theme,
  type ThemeEnvironment,
  type ThemePreference
} from "@/shell/theme/Theme"

interface Fake {
  readonly environment: ThemeEnvironment
  readonly inspect: () => { readonly written: ReadonlyArray<Theme>; readonly stored: string | null }
  readonly flipSystem: (dark: boolean) => void
}

/** A whole environment, substituted — no global is touched. */
const fakeEnvironment = (
  options: {
    readonly stored?: string | null
    readonly systemDark?: boolean
    readonly storageThrows?: boolean
    readonly noStorage?: boolean
    readonly noMedia?: boolean
  } = {}
): Fake => {
  let stored = options.stored ?? null
  let matches = options.systemDark ?? false
  const written: Array<Theme> = []
  const changeListeners = new Set<() => void>()

  const storage: ThemeEnvironment["storage"] = {
    getItem: () => {
      if (options.storageThrows === true) throw new Error("The operation is insecure.")
      return stored
    },
    setItem: (_key, value) => {
      if (options.storageThrows === true) throw new Error("The operation is insecure.")
      stored = value
    }
  }

  const darkMedia: DarkMediaQuery = {
    get matches() {
      return matches
    },
    addEventListener: (_type, listener) => {
      changeListeners.add(listener)
    },
    removeEventListener: (_type, listener) => {
      changeListeners.delete(listener)
    }
  }

  return {
    environment: {
      storage: options.noStorage === true ? undefined : storage,
      darkMedia: options.noMedia === true ? undefined : darkMedia,
      writeTheme: (theme) => written.push(theme)
    },
    inspect: () => ({ written, stored }),
    flipSystem: (dark) => {
      matches = dark
      for (const listener of changeListeners) listener()
    }
  }
}

describe("reading the preference", () => {
  it("follows the system when nothing is stored", () => {
    const store = makeThemeStore(fakeEnvironment().environment)
    expect(store.preference()).toBe("system")
  })

  it("follows the system when the stored value is nonsense", () => {
    const store = makeThemeStore(fakeEnvironment({ stored: "lavender" }).environment)
    expect(store.preference()).toBe("system")
  })

  it("returns an explicit choice", () => {
    const store = makeThemeStore(fakeEnvironment({ stored: "dark" }).environment)
    expect(store.preference()).toBe("dark")
  })

  it("survives storage that refuses to be read", () => {
    const store = makeThemeStore(fakeEnvironment({ storageThrows: true }).environment)
    expect(store.preference()).toBe("system")
  })

  it("survives a browser with no storage at all", () => {
    const store = makeThemeStore(fakeEnvironment({ noStorage: true }).environment)
    expect(store.preference()).toBe("system")
  })
})

describe("resolving to a theme", () => {
  it("passes an explicit choice through, whatever the system says", () => {
    const store = makeThemeStore(fakeEnvironment({ stored: "light", systemDark: true }).environment)
    expect(store.theme()).toBe("light")
  })

  it("asks the system when the preference is system", () => {
    expect(makeThemeStore(fakeEnvironment({ systemDark: true }).environment).theme()).toBe("dark")
    expect(makeThemeStore(fakeEnvironment({ systemDark: false }).environment).theme()).toBe("light")
  })

  it("assumes light when the browser cannot be asked", () => {
    const store = makeThemeStore(fakeEnvironment({ noMedia: true }).environment)
    expect(store.theme()).toBe("light")
  })
})

describe("setting a preference", () => {
  it("stores it, paints it and notifies", () => {
    const fake = fakeEnvironment()
    const store = makeThemeStore(fake.environment)
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })

    store.set("dark")

    expect(fake.inspect().stored).toBe("dark")
    expect(fake.inspect().written).toStrictEqual(["dark"])
    expect(notified).toBe(1)
    expect(STORAGE_KEY).toBe("delta.theme")
  })

  it("still paints when the write is refused", () => {
    const fake = fakeEnvironment({ storageThrows: true })
    const store = makeThemeStore(fake.environment)

    store.set("dark")

    expect(fake.inspect().written).toStrictEqual(["dark"])
  })
})

describe("the system flipping underneath", () => {
  it("repaints and notifies while the preference is system", () => {
    const fake = fakeEnvironment({ systemDark: false })
    const store = makeThemeStore(fake.environment)
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })

    fake.flipSystem(true)

    expect(fake.inspect().written).toStrictEqual(["dark"])
    expect(notified).toBe(1)
  })

  it("repaints the explicit choice, not the system's", () => {
    const fake = fakeEnvironment({ stored: "light", systemDark: false })
    const store = makeThemeStore(fake.environment)
    store.subscribe(() => {})

    fake.flipSystem(true)

    expect(fake.inspect().written).toStrictEqual(["light"])
  })

  it("stops listening once unsubscribed", () => {
    const fake = fakeEnvironment()
    const store = makeThemeStore(fake.environment)
    let notified = 0
    const unsubscribe = store.subscribe(() => {
      notified += 1
    })

    unsubscribe()
    fake.flipSystem(true)

    expect(notified).toBe(0)
    expect(fake.inspect().written).toStrictEqual([])
  })
})

describe("each store", () => {
  it("keeps its own listeners, so one cannot notify another", () => {
    const first = makeThemeStore(fakeEnvironment().environment)
    const second = makeThemeStore(fakeEnvironment().environment)
    let notified = 0
    first.subscribe(() => {
      notified += 1
    })

    second.set("dark" satisfies ThemePreference)

    expect(notified).toBe(0)
  })
})
