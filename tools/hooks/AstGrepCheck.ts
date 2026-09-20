import { type GatedEdit, onGatedEdit } from "./GatedEdit.ts"
import { idiomCheckedExtensions } from "./GatedFiles.ts"
import { projectBinary, run } from "./Processes.ts"
import { block } from "./Verdict.ts"

// Structural idiom gate on the file Claude just edited. The whole-tree scan runs in CI.
const sgconfig = ".config/ast-grep/sgconfig.yml"

// Pass 1 applies any rule that defines a fix; rules without one are left for pass 2 to report.
//
// `unused-suppression` stays OFF here: it is an ast-grep built-in whose "fix" DELETES a suppression
// comment it considers unused, so a blanket --update-all would silently strip one that is only
// momentarily unused because the edit is half-finished.
const applyFixes = ({ path, projectDirectory }: GatedEdit) =>
  run({
    command: projectBinary({ name: "ast-grep", projectDirectory }),
    args: ["scan", "-c", sgconfig, "--update-all", "--off=unused-suppression", path],
    cwd: projectDirectory
  })

const check = (edit: GatedEdit) => {
  applyFixes(edit)
  const verdict = run({
    command: projectBinary({ name: "ast-grep", projectDirectory: edit.projectDirectory }),
    args: ["scan", "-c", sgconfig, "--report-style", "short", edit.path],
    cwd: edit.projectDirectory
  })
  if (verdict.code !== 0) block(`${verdict.stdout}${verdict.stderr}`)
}

onGatedEdit(idiomCheckedExtensions, check)
