import { Array } from "effect"

export const lintableExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]

export const idiomCheckedExtensions = [".ts", ".tsx"]

/** Markdown is the spec, the brief and the tickets — authored prose the formatter leaves alone. */
export const formattableExtensions = [...lintableExtensions, ".json", ".jsonc", ".css"]

export interface CandidateFile {
  readonly path: string
  readonly projectDirectory: string
  readonly extensions: ReadonlyArray<string>
}

/**
 * Whether an edited file is one a gate should look at: inside the project, not a build artefact, and
 * of a kind the gate understands. A file elsewhere on disk is somebody else's business.
 */
export const isGated = ({ path, projectDirectory, extensions }: CandidateFile) =>
  path.startsWith(`${projectDirectory}/`) &&
  !path.startsWith(`${projectDirectory}/dist/`) &&
  !path.startsWith(`${projectDirectory}/node_modules/`) &&
  Array.some(extensions, (extension) => path.endsWith(extension))
