import { execFile } from "node:child_process"
import { copyFile, mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"

import { describe, expect, it } from "vitest"

const run = promisify(execFile)

const PROJECT = process.cwd()
const DEPCRUISE = join(PROJECT, "node_modules", ".bin", "depcruise")
const CONFIG = join(PROJECT, ".dependency-cruiser.cjs")

/**
 * Runs the project's real rules over a throwaway tree. A fixture cannot live
 * under `src/` — the rules would then fire on every ordinary run — and the
 * rules are anchored on `^src/`, so the fixture needs its own project root.
 */
const cruise = async (files: Record<string, string>): Promise<{ code: number; output: string }> => {
  const root = await mkdtemp(join(tmpdir(), "delta-boundaries-"))
  await copyFile(join(PROJECT, "tsconfig.base.json"), join(root, "tsconfig.base.json"))
  // node_modules and package.json both matter: without them `react` resolves to
  // nothing, or resolves but is classified `npm-unknown` rather than `npm`, and
  // the rule under test never fires.
  await copyFile(join(PROJECT, "package.json"), join(root, "package.json"))
  await symlink(join(PROJECT, "node_modules"), join(root, "node_modules"), "dir")

  for (const [path, contents] of Object.entries(files)) {
    const full = join(root, path)
    await mkdir(join(full, ".."), { recursive: true })
    await writeFile(full, contents)
  }

  try {
    const { stdout } = await run(DEPCRUISE, ["src", "--config", CONFIG], { cwd: root })
    return { code: 0, output: stdout }
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string }
    return { code: failure.code ?? 1, output: `${failure.stdout ?? ""}${failure.stderr ?? ""}` }
  }
}

describe("the hexagon is enforced, not merely documented", () => {
  it("rejects a use case importing its own secondary adapter", async () => {
    const { code, output } = await cruise({
      "src/modules/demo/core/use_cases/Bad.ts": `import { thing } from "@/modules/demo/secondary_adapters/Thing"\nexport const bad = thing\n`,
      "src/modules/demo/secondary_adapters/Thing.ts": `export const thing = 1\n`
    })
    expect(code).not.toBe(0)
    expect(output).toContain("core-no-adapters")
  })

  it("rejects React inside core", async () => {
    const { code, output } = await cruise({
      "src/modules/demo/core/domain/Bad.ts": `import { useState } from "react"\nexport const bad = useState\n`
    })
    expect(code).not.toBe(0)
    expect(output).toContain("core-no-framework")
  })

  it("rejects a component importing a secondary adapter", async () => {
    const { code, output } = await cruise({
      "src/modules/demo/primary_adapters/react/Bad.ts": `import { thing } from "@/modules/demo/secondary_adapters/Thing"\nexport const bad = thing\n`,
      "src/modules/demo/secondary_adapters/Thing.ts": `export const thing = 1\n`
    })
    expect(code).not.toBe(0)
    expect(output).toContain("primary-no-secondary")
  })

  it("rejects an adapter reaching past the secondary ports into a use case", async () => {
    const { code, output } = await cruise({
      "src/modules/demo/secondary_adapters/Bad.ts": `import { run } from "@/modules/demo/core/use_cases/Run"\nexport const bad = run\n`,
      "src/modules/demo/core/use_cases/Run.ts": `export const run = 1\n`
    })
    expect(code).not.toBe(0)
    expect(output).toContain("secondary-only-secondary-ports")
  })

  it("rejects shared/domain depending on a module", async () => {
    const { code, output } = await cruise({
      "src/shared/domain/Bad.ts": `import { thing } from "@/modules/demo/core/domain/Thing"\nexport const bad = thing\n`,
      "src/modules/demo/core/domain/Thing.ts": `export const thing = 1\n`
    })
    expect(code).not.toBe(0)
    expect(output).toContain("shared-domain-is-a-leaf")
  })

  it("rejects a cycle", async () => {
    const { code, output } = await cruise({
      "src/modules/demo/core/domain/A.ts": `import { b } from "./B"\nexport const a = b\n`,
      "src/modules/demo/core/domain/B.ts": `import { a } from "./A"\nexport const b = a\n`
    })
    expect(code).not.toBe(0)
    expect(output).toContain("no-circular")
  })

  it("accepts a use case importing its own secondary port", async () => {
    const { code } = await cruise({
      "src/modules/demo/core/use_cases/Good.ts": `import { Port } from "@/modules/demo/core/ports/secondary/Port"\nexport const good = Port\n`,
      "src/modules/demo/core/ports/secondary/Port.ts": `export const Port = 1\n`
    })
    expect(code).toBe(0)
  })
})
