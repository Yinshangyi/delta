import { relative } from "node:path"

import { type GatedEdit, onGatedEdit } from "./GatedEdit.ts"
import { idiomCheckedExtensions } from "./GatedFiles.ts"
import { projectBinary, run } from "./Processes.ts"
import { block } from "./Verdict.ts"

// The hexagon, at edit time rather than at pre-push. The whole deferred-distribution argument in
// architecture.md rests on these boundaries holding, and a violation is far cheaper to fix in the
// turn that wrote it.
//
// Cruising one file still follows its imports, so an illegal edge *from* it is found here; edges
// *into* it are the whole-tree run's job, in CI.
const check = ({ path, projectDirectory }: GatedEdit) => {
  const withinSource = relative(projectDirectory, path)
  if (!withinSource.startsWith("src/")) return
  if (withinSource.includes(".test.")) return

  const verdict = run({
    command: projectBinary({ name: "depcruise", projectDirectory }),
    args: [withinSource],
    cwd: projectDirectory
  })
  if (verdict.code !== 0) block(`${verdict.stdout}${verdict.stderr}`)
}

onGatedEdit(idiomCheckedExtensions, check)
