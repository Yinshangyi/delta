import { describe, expect, it } from "vitest"

import { DEFAULT_SECTION, fromHash, SECTIONS, titleOf, toHash } from "@/shell/routing/Section"

describe("the navigation", () => {
  it("has exactly the six sections spec §76 names", () => {
    expect([...SECTIONS]).toStrictEqual([
      "dashboard",
      "projection",
      "capital",
      "commitments",
      "scenarios",
      "settings"
    ])
  })

  it("has no section for the things the spec forbids", () => {
    const forbidden = ["transactions", "accounts", "taxes", "debt", "budgets", "salary"]
    for (const name of forbidden) expect(SECTIONS).not.toContain(name)
  })

  it("titles each section for display", () => {
    expect(titleOf("commitments")).toBe("Commitments")
    expect(SECTIONS.map(titleOf).every((title) => title.length > 0)).toBe(true)
  })
})

describe("the hash", () => {
  it("round-trips every section", () => {
    for (const section of SECTIONS) expect(fromHash(toHash(section))).toBe(section)
  })

  it("reads a section from the URL a reload would restore", () => {
    expect(fromHash("#/capital")).toBe("capital")
    expect(fromHash("#capital")).toBe("capital")
  })

  it("falls back to the dashboard rather than rendering nothing", () => {
    expect(fromHash("")).toBe(DEFAULT_SECTION)
    expect(fromHash("#/")).toBe(DEFAULT_SECTION)
    expect(fromHash("#/nonsense")).toBe(DEFAULT_SECTION)
  })

  it("ignores anything after the section", () => {
    expect(fromHash("#/capital/holding/7")).toBe("capital")
    expect(fromHash("#/capital?from=dashboard")).toBe("capital")
  })
})
