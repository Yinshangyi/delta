#!/usr/bin/env bash
# Formats the file just edited, in place, so edits land already formatted.
# Auto-fix only: formatting is deterministic, so there is nothing to fail on.
set -u
# shellcheck source=/dev/null
. "$(dirname "$0")/_edited-file.sh"

main() {
  command -v jq >/dev/null 2>&1 || exit 0
  command -v pnpm >/dev/null 2>&1 || exit 0

  local file project_dir
  file=$(edited_file) || exit 0
  project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
  in_project "$file" "$project_dir" || exit 0
  case "$file" in
    *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.json | *.jsonc | *.css) ;;
    *) exit 0 ;;
  esac

  cd "$project_dir" || exit 0
  pnpm exec oxfmt --write "$file" >/dev/null 2>&1 || true
  exit 0
}

main
