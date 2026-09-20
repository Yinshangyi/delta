import { Function, Option } from "effect"

import { isGated } from "./GatedFiles.ts"
import { currentProjectDirectory, editedFile, readPayload } from "./HookPayload.ts"

export interface GatedEdit {
  readonly path: string
  readonly projectDirectory: string
}

/**
 * Runs `gate` on the file Claude just edited — when the payload is an edit, and the file is one this
 * gate looks at. Anything else passes untouched: a hook must never stand in the way of an edit it
 * has no opinion on.
 */
export const onGatedEdit = (extensions: ReadonlyArray<string>, gate: (edit: GatedEdit) => void) => {
  const projectDirectory = currentProjectDirectory()
  Option.match(
    editedFile(readPayload()).pipe(
      Option.filter((path) => isGated({ path, projectDirectory, extensions }))
    ),
    { onNone: Function.constVoid, onSome: (path) => gate({ path, projectDirectory }) }
  )
}
