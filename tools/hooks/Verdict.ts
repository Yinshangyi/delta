/**
 * Refuses the edit that was just made: Claude Code shows stderr to Claude and treats exit code 2 as
 * "re-edit until this is empty". Any other exit keeps the edit.
 */
export const block = (report: string) => {
  process.stderr.write(`${report.trimEnd()}\n`)
  process.exitCode = 2
}
