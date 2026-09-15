#!/usr/bin/env bash
# Two passes over the file just edited:
#   1. oxlint --fix  — apply what can be applied
#   2. oxlint        — on anything left, exit 2 with the report on stderr
#
# Exit 2 is the point. It hands the finding back while the context that
# produced it is still in the conversation, instead of at review.
set -u
# shellcheck source=/dev/null
. "$(dirname "$0")/_edited-file.sh"

main() {
  command -v jq >/dev/null 2>&1 || {
    echo "lint-fix: jq not found; skipping" >&2
    exit 0
  }
  command -v pnpm >/dev/null 2>&1 || {
    echo "lint-fix: pnpm not found; skipping" >&2
    exit 0
  }

  local file project_dir out
  file=$(edited_file) || exit 0
  project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
  in_project "$file" "$project_dir" || exit 0
  case "$file" in *.ts | *.tsx) ;; *) exit 0 ;; esac

  cd "$project_dir" || exit 0
  pnpm exec oxlint --fix "$file" >/dev/null 2>&1

  if ! out=$(pnpm exec oxlint "$file" 2>&1); then
    printf '%s\n' "$out" >&2
    exit 2
  fi
  exit 0
}

main
