import { Option } from "effect"
import { describe, expect, it } from "vitest"

import { rewriteOf, withRtkSetting } from "./RtkDecision.ts"

describe("rewriteOf", () => {
  it("allows a rewrite nothing objects to", () => {
    const rewrite = rewriteOf({ original: "git status", rewritten: "rtk git status", exitCode: 0 })

    expect(rewrite).toStrictEqual(Option.some({ command: "rtk git status", autoAllowed: true }))
  })

  it("rewrites but lets Claude Code ask when an ask rule matched", () => {
    const rewrite = rewriteOf({ original: "git push", rewritten: "rtk git push", exitCode: 3 })

    expect(rewrite).toStrictEqual(Option.some({ command: "rtk git push", autoAllowed: false }))
  })

  it("passes through a command rtk already runs", () => {
    const rewrite = rewriteOf({ original: "rtk ls", rewritten: "rtk ls", exitCode: 0 })

    expect(rewrite).toStrictEqual(Option.none())
  })

  it("passes through when a deny rule matched", () => {
    const rewrite = rewriteOf({ original: "rm -rf x", rewritten: "", exitCode: 2 })

    expect(rewrite).toStrictEqual(Option.none())
  })
})

describe("withRtkSetting", () => {
  it("puts rtk on PATH and its history in the project", () => {
    const command = withRtkSetting({
      command: "rtk git status",
      rtkDirectory: "/nix/store/rtk/bin",
      projectDirectory: "/p"
    })

    expect(command).toBe(
      'export PATH="/nix/store/rtk/bin":"$PATH" RTK_DB_PATH="/p/.claude/cache/rtk/history.db" RTK_TELEMETRY_DISABLED=1; rtk git status'
    )
  })
})
