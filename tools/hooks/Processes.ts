import { spawnSync } from "node:child_process"
import { join } from "node:path"

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

/** A tool installed in the project's node_modules, called directly: `pnpm exec` costs a second. */
export const projectBinary = ({
  name,
  projectDirectory
}: {
  readonly name: string
  readonly projectDirectory: string
}) => join(projectDirectory, "node_modules", ".bin", name)
