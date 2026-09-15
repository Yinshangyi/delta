import { describe, expect, it } from "vitest"

import { apply, readPreference, STORAGE_KEY, writePreference } from "@/shell/theme/Theme"

describe("applying a theme", () => {
  it("writes the attribute the stylesheet switches on", () => {
    apply("dark")
    expect(document.documentElement.dataset["theme"]).toBe("dark")
    apply("light")
    expect(document.documentElement.dataset["theme"]).toBe("light")
  })
})

describe("an explicit override", () => {
  it("persists, so a reload keeps it", () => {
    writePreference("dark")
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark")
    expect(readPreference()).toBe("dark")
    expect(document.documentElement.dataset["theme"]).toBe("dark")

    writePreference("system")
    expect(readPreference()).toBe("system")
  })
})
