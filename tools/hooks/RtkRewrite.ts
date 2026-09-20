import { dirname } from "node:path"

import { Function, Option, Schema } from "effect"

import { type BashCall, bashCall, currentProjectDirectory, readPayload } from "./HookPayload.ts"
import { executableOnPath, run } from "./Processes.ts"
import { type Rewrite, rewriteOf, withRtkSetting } from "./RtkDecision.ts"

// Routes shell commands through rtk, which trims their output before it reaches the model. Every
// rewrite rule lives in `rtk rewrite` itself; this hook only relays its answer to Claude Code.

const HookOutput = Schema.Struct({
  hookSpecificOutput: Schema.Struct({
    hookEventName: Schema.Literal("PreToolUse"),
    permissionDecision: Schema.optional(Schema.Literal("allow")),
    permissionDecisionReason: Schema.optional(Schema.String),
    updatedInput: Schema.Record(Schema.String, Schema.Unknown)
  })
})

interface Relay {
  readonly call: BashCall
  readonly rewrite: Rewrite
}

const relay = ({ call, rewrite }: Relay) =>
  process.stdout.write(
    Schema.encodeSync(Schema.fromJsonString(HookOutput))({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        ...(rewrite.autoAllowed && {
          permissionDecision: "allow",
          permissionDecisionReason: "RTK auto-rewrite"
        }),
        updatedInput: { ...call.input, command: rewrite.command }
      }
    })
  )

const rewrite = ({ call, rtk }: { readonly call: BashCall; readonly rtk: string }) => {
  const projectDirectory = currentProjectDirectory()
  const answer = run({ command: rtk, args: ["rewrite", call.command], cwd: projectDirectory })
  const outcome = {
    original: call.command,
    rewritten: answer.stdout.trim(),
    exitCode: answer.code
  }
  Option.match(rewriteOf(outcome), {
    onNone: Function.constVoid,
    onSome: (found) =>
      relay({
        call,
        rewrite: {
          ...found,
          command: withRtkSetting({
            command: found.command,
            rtkDirectory: dirname(rtk),
            projectDirectory
          })
        }
      })
  })
}

Option.match(executableOnPath("rtk"), {
  onNone: () =>
    process.stderr.write("[rtk] rtk is not on PATH: run `direnv allow` once in the project.\n"),
  onSome: (rtk) =>
    Option.match(bashCall(readPayload()), {
      onNone: Function.constVoid,
      onSome: (call) => rewrite({ call, rtk })
    })
})
