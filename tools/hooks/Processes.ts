import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { delimiter, join } from "node:path"

import { Array, Option } from "effect"

export interface Invocation {
  readonly command: string
  readonly args: ReadonlyArray<string>
  readonly cwd: string
}

export interface Completion {
  /** The exit status; a process that could not start at all counts as 127, like a shell's. */
  readonly code: number
  readonly stdout: string
  readonly stderr: string
}

export const run = ({ command, args, cwd }: Invocation): Completion => {
  const result = spawnSync(command, [...args], { cwd, encoding: "utf8" })
  return { code: result.status ?? 127, stdout: result.stdout ?? "", stderr: result.stderr ?? "" }
}

/** Where an executable lives on PATH, the way the shell's `command -v` would find it. */
export const executableOnPath = (name: string) =>
  Array.findFirst((process.env["PATH"] ?? "").split(delimiter), (directory) =>
    existsSync(join(directory, name))
  ).pipe(Option.map((directory) => join(directory, name)))

/** A tool installed in the project's node_modules, called directly: `pnpm exec` costs a second. */
export const projectBinary = ({
  name,
  projectDirectory
}: {
  readonly name: string
  readonly projectDirectory: string
}) => join(projectDirectory, "node_modules", ".bin", name)
