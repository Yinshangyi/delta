import { Option } from "effect"
import { describe, expect, it } from "vitest"

import { editedFile } from "./HookPayload.ts"

describe("the edited file", () => {
  it("is named by an edit tool's payload", () => {
    expect(
      editedFile('{"tool_name":"Write","tool_input":{"file_path":"/p/src/A.ts"}}')
    ).toStrictEqual(Option.some("/p/src/A.ts"))
  })

  it("is found for every tool that writes", () => {
    for (const tool of ["Edit", "Write", "MultiEdit", "NotebookEdit"]) {
      expect(
        editedFile(`{"tool_name":"${tool}","tool_input":{"file_path":"/p/src/A.ts"}}`)
      ).toStrictEqual(Option.some("/p/src/A.ts"))
    }
  })

  it("is absent for a tool that edits nothing", () => {
    expect(
      editedFile('{"tool_name":"Read","tool_input":{"file_path":"/p/src/A.ts"}}')
    ).toStrictEqual(Option.none())
    expect(editedFile('{"tool_name":"Bash","tool_input":{"command":"ls"}}')).toStrictEqual(
      Option.none()
    )
  })

  it("is absent when the payload is not JSON, rather than throwing into the edit flow", () => {
    expect(editedFile("not json")).toStrictEqual(Option.none())
    expect(editedFile("")).toStrictEqual(Option.none())
  })

  it("is absent when the path is empty", () => {
    expect(editedFile('{"tool_name":"Write","tool_input":{"file_path":""}}')).toStrictEqual(
      Option.none()
    )
  })
})
