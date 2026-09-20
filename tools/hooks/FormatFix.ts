import { type GatedEdit, onGatedEdit } from "./GatedEdit.ts"
import { formattableExtensions } from "./GatedFiles.ts"
import { projectBinary, run } from "./Processes.ts"

// Formats the file Claude just edited, so edits land already formatted. Auto-fix only: formatting is
// deterministic, so there is nothing to fail on, and a formatter failure must not block the edit —
// CI re-enforces it.
const format = ({ path, projectDirectory }: GatedEdit) =>
  run({
    command: projectBinary({ name: "oxfmt", projectDirectory }),
    args: ["--write", path],
    cwd: projectDirectory
  })

onGatedEdit(formattableExtensions, format)
