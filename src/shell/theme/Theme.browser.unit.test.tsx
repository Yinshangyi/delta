import { describe, expect, it } from "vitest"

import { makeThemeStore, STORAGE_KEY, themeStore } from "@/shell/theme/Theme"

/**
 * The node tests cover the logic against a substituted environment. This one
 * covers the default environment itself — that the real browser's storage,
 * media query and document are wired to the right places.
 */
describe("the browser environment", () => {
  it("writes the attribute the stylesheet switches on", () => {
    themeStore.set("dark")
    expect(document.documentElement.dataset["theme"]).toBe("dark")
    themeStore.set("light")
    expect(document.documentElement.dataset["theme"]).toBe("light")
  })

  it("persists an explicit override, so a reload keeps it", () => {
    themeStore.set("dark")
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark")
    expect(makeThemeStore().preference()).toBe("dark")

    themeStore.set("system")
    expect(makeThemeStore().preference()).toBe("system")
  })
})
