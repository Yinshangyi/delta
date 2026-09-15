import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

/**
 * Reads the stylesheet rather than a rendered page: the palette is a contract
 * stated in one file, and parsing it checks that contract without depending on
 * how a bundler happens to process CSS in a test runner.
 */
const stylesheet = await readFile(join(process.cwd(), "src", "index.css"), "utf8")

const paletteIn = (block: string): ReadonlyMap<string, string> => {
  const body = stylesheet.slice(stylesheet.indexOf(block) + block.length)
  const entries = body.slice(0, body.indexOf("}")).matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]{6})/g)
  return new Map([...entries].map((match) => [match[1] as string, match[2] as string]))
}

const LIGHT = paletteIn("@theme static {")
const DARK = paletteIn('[data-theme="dark"] {')

const channel = (value: number): number => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!)
}

const contrast = (a: string, b: string): number => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high! + 0.05) / (low! + 0.05)
}

const colour = (palette: ReadonlyMap<string, string>, role: string): string => {
  const value = palette.get(`--color-${role}`)
  expect(value, `--color-${role} is missing`).toBeDefined()
  return value!
}

// The roles under test, not a fixture — nothing here is mutated, and each
// case below is generated from it rather than sharing state through it.
// ast-grep-ignore: no-shared-test-fixture-value
const TEXT_ROLES = ["ink", "muted", "accent", "positive", "negative", "estimated"]
const THEMES = [
  ["light", LIGHT],
  ["dark", DARK]
] as const

describe("the palette", () => {
  it("defines every role in both themes", () => {
    expect([...LIGHT.keys()].sort()).toStrictEqual([...DARK.keys()].sort())
    expect(LIGHT.size).toBeGreaterThan(8)
  })

  it("is designed rather than inverted — no role reuses its light value", () => {
    const shared = [...LIGHT.entries()].filter(([token, value]) => DARK.get(token) === value)
    expect(shared).toStrictEqual([])
  })
})

describe.each(THEMES)("%s theme contrast", (_name, palette) => {
  it.each(TEXT_ROLES)("reads at WCAG AA on the ground: %s", (role) => {
    expect(contrast(colour(palette, role), colour(palette, "ground"))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(TEXT_ROLES)("reads at WCAG AA on a surface: %s", (role) => {
    expect(contrast(colour(palette, role), colour(palette, "surface"))).toBeGreaterThanOrEqual(4.5)
  })

  it("keeps accent ink legible on the accent itself", () => {
    expect(
      contrast(colour(palette, "accent-ink"), colour(palette, "accent"))
    ).toBeGreaterThanOrEqual(4.5)
  })
})
