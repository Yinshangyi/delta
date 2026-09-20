import { readFileSync } from "node:fs"

import { type GatedEdit, onGatedEdit } from "./GatedEdit.ts"
import { lintableExtensions } from "./GatedFiles.ts"
import { projectBinary, run } from "./Processes.ts"
import { block } from "./Verdict.ts"

// Lint guard on the file Claude just edited. `--fix` writes what it can and still reports — and
// exits non-zero on — what it cannot, so one run both fixes and verifies its INPUT. On residual
// errors the report goes to Claude, which re-edits.
//
// What that one run cannot do is notice a file it broke itself: oxlint reports a parse error present
// in its input but exits 0 after writing one. So when the run rewrites the file, it is linted again,
// and a fixer that corrupts is loud on the save that caused it.
const lint = ({ path, projectDirectory }: GatedEdit) => {
  const oxlint = projectBinary({ name: "oxlint", projectDirectory })
  const before = readFileSync(path, "utf8")
  const fixing = run({ command: oxlint, args: ["--fix", path], cwd: projectDirectory })
  const verdict =
    readFileSync(path, "utf8") === before
      ? fixing
      : run({ command: oxlint, args: [path], cwd: projectDirectory })
  if (verdict.code !== 0) block(`${verdict.stdout}${verdict.stderr}`)
}

onGatedEdit(lintableExtensions, lint)
