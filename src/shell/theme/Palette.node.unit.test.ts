import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

/**
 * Reads the stylesheet rather than a rendered page. This file guarantees the
 * palette is *stated* correctly — that every role exists in both themes and
 * every pair is legible. What it cannot see is what the browser finally paints,
 * which is why `apply()` is covered separately in the browser project.
 */
const stylesheet = await readFile(join(import.meta.dirname, "..", "..", "index.css"), "utf8")

const ROLES = [
  "ground",
  "surface",
  "raised",
  "line",
  "ink",
  "muted",
  "accent",
  "accent-ink",
  "accent-soft",
  "forecast",
  "positive",
  "negative",
  "estimated"
] as const

type Role = (typeof ROLES)[number]

const paletteIn = (block: string): ReadonlyMap<string, string> => {
  const start = stylesheet.indexOf(block)
  expect(start, `no ${block} block — the stylesheet was reformatted`).toBeGreaterThan(-1)
  const body = stylesheet.slice(start + block.length)
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

const colour = (palette: ReadonlyMap<string, string>, role: Role): string => {
  const value = palette.get(`--color-${role}`)
  expect(value, `--color-${role} is missing`).toBeDefined()
  return value!
}

/**
 * `forecast` is here because the chart labels its crossing month in it, so it
 * is text as well as a stroke — a colour that only ever drew a 2px line would
 * not owe the same 4.5:1.
 */
const TEXT_ROLES = [
  "ink",
  "muted",
  "accent",
  "forecast",
  "positive",
  "negative",
  "estimated"
] as const

const THEMES = [
  ["light", LIGHT],
  ["dark", DARK]
] as const

describe("the palette", () => {
  /**
   * The parse is `indexOf` and a regex, which would truncate silently at an
   * unexpected `}` and leave the contrast tests checking a handful of tokens
   * while still passing. Accounting for every declaration in the file is what
   * makes that impossible.
   */
  it("is read whole, not truncated by a stray brace", () => {
    const declared = [...stylesheet.matchAll(/--color-[\w-]+:/g)].length
    expect(LIGHT.size + DARK.size).toBe(declared)
  })

  it("defines exactly the same roles in both themes", () => {
    const expected = ROLES.map((role) => `--color-${role}`).sort()
    expect([...LIGHT.keys()].sort()).toStrictEqual(expected)
    expect([...DARK.keys()].sort()).toStrictEqual(expected)
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
