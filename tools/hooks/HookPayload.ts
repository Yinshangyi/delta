import { readFileSync } from "node:fs"

import { Array, Option, Predicate, Record, Schema, String } from "effect"

/** The part of Claude Code's hook payload these hooks read. */
const HookPayload = Schema.Struct({
  tool_name: Schema.optional(Schema.String),
  tool_input: Schema.optional(Schema.Struct({ file_path: Schema.optional(Schema.String) }))
})

const fileEditingTools = ["Edit", "Write", "MultiEdit", "NotebookEdit"]

/** The file an edit tool just wrote, if the payload is one. Any other tool, or no path, is none. */
export const editedFile = (payload: string) =>
  Schema.decodeUnknownOption(Schema.fromJsonString(HookPayload))(payload).pipe(
    Option.filter(({ tool_name }) => Array.contains(fileEditingTools, tool_name ?? "")),
    Option.flatMap(({ tool_input }) => Option.fromNullishOr(tool_input?.file_path)),
    Option.filter(String.isNonEmpty)
  )

/** A Bash tool call: its whole input, kept intact so a rewrite changes nothing but the command. */
export interface BashCall {
  readonly input: Readonly<Record<string, unknown>>
  readonly command: string
}

const BashPayload = Schema.Struct({ tool_input: Schema.Record(Schema.String, Schema.Unknown) })

/** The Bash call a payload announces, if it carries a command. */
export const bashCall = (payload: string) =>
  Schema.decodeUnknownOption(Schema.fromJsonString(BashPayload))(payload).pipe(
    Option.flatMap(({ tool_input }) =>
      Record.get(tool_input, "command").pipe(
        Option.filter(Predicate.isString),
        Option.filter(String.isNonEmpty),
        Option.map((command): BashCall => ({ input: tool_input, command }))
      )
    )
  )

/** The payload Claude Code writes to a hook's stdin. */
export const readPayload = () => readFileSync(0, "utf8")

/** The project the hook runs for: Claude Code's own answer, or the directory it was started in. */
export const currentProjectDirectory = () => process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd()
