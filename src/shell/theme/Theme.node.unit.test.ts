import { beforeEach, describe, expect, it, vi } from "vitest"

import { readPreference, resolve } from "@/shell/theme/Theme"

describe("the stored preference", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it("defaults to following the system when nothing is stored", () => {
    vi.stubGlobal("localStorage", { getItem: () => null })
    expect(readPreference()).toBe("system")
  })

  it("defaults to following the system when the stored value is nonsense", () => {
    vi.stubGlobal("localStorage", { getItem: () => "lavender" })
    expect(readPreference()).toBe("system")
  })

  it("survives storage being unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("The operation is insecure.")
      }
    })
    expect(readPreference()).toBe("system")
  })

  it("returns an explicit choice", () => {
    // The key itself is asserted in the browser test, against real storage.
    vi.stubGlobal("localStorage", { getItem: () => "dark" })
    expect(readPreference()).toBe("dark")
  })
})

describe("resolving a preference to a theme", () => {
  it("passes an explicit choice through", () => {
    expect(resolve("light")).toBe("light")
    expect(resolve("dark")).toBe("dark")
  })

  it("asks the system when the preference is system", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }))
    expect(resolve("system")).toBe("dark")
    vi.stubGlobal("matchMedia", () => ({ matches: false }))
    expect(resolve("system")).toBe("light")
  })
})
