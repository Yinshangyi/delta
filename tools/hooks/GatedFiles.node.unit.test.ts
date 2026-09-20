import { describe, expect, it } from "vitest"

import {
  formattableExtensions,
  idiomCheckedExtensions,
  isGated,
  lintableExtensions
} from "./GatedFiles.ts"

const project = "/home/dev/delta"

const gated = (path: string, extensions = lintableExtensions) =>
  isGated({ path, projectDirectory: project, extensions })

describe("which files a gate looks at", () => {
  it("includes source inside the project", () => {
    expect(gated(`${project}/src/shared/domain/Money.ts`)).toBe(true)
    expect(gated(`${project}/src/App.tsx`)).toBe(true)
  })

  it("excludes anything outside the project, which is somebody else's business", () => {
    expect(gated("/home/dev/other/src/Money.ts")).toBe(false)
    expect(gated("/etc/passwd.ts")).toBe(false)
  })

  it("excludes build output and dependencies", () => {
    expect(gated(`${project}/dist/assets/index.js`)).toBe(false)
    expect(gated(`${project}/node_modules/effect/index.ts`)).toBe(false)
  })

  it("excludes a kind the gate does not understand", () => {
    expect(gated(`${project}/README.md`)).toBe(false)
    expect(gated(`${project}/flake.nix`)).toBe(false)
  })

  it("does not confuse a sibling directory for the project", () => {
    expect(gated("/home/dev/delta-archive/src/A.ts")).toBe(false)
  })
})

describe("the extension sets", () => {
  it("narrow as the gate gets more opinionated", () => {
    expect(idiomCheckedExtensions.length).toBeLessThan(lintableExtensions.length)
    expect(formattableExtensions.length).toBeGreaterThan(lintableExtensions.length)
  })

  it("leave markdown to its authors", () => {
    expect(formattableExtensions).not.toContain(".md")
  })
})
