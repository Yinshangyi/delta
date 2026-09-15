#!/usr/bin/env bash
# Structural idiom gate on the file just edited. Applies any rule that carries
# a fix, then re-scans and exits 2 with the report on stderr.
#
# These rules say what the type system cannot: not "this does not compile" but
# "this is not how we do it here, and here is why" — so the note matters as
# much as the match.
set -u
# shellcheck source=/dev/null
. "$(dirname "$0")/_edited-file.sh"

readonly SGCONFIG=".config/ast-grep/sgconfig.yml"

main() {
  command -v jq >/dev/null 2>&1 || {
    echo "ast-grep-check: jq not found; skipping" >&2
    exit 0
  }
  command -v pnpm >/dev/null 2>&1 || {
    echo "ast-grep-check: pnpm not found; skipping" >&2
    exit 0
  }

  local file project_dir out
  file=$(edited_file) || exit 0
  project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
  in_project "$file" "$project_dir" || exit 0
  case "$file" in *.ts | *.tsx) ;; *) exit 0 ;; esac

  cd "$project_dir" || exit 0
  pnpm exec ast-grep scan -c "$SGCONFIG" --update-all "$file" >/dev/null 2>&1 || true

  if ! out=$(pnpm exec ast-grep scan -c "$SGCONFIG" --report-style short "$file" 2>&1); then
    printf '%s\n' "$out" >&2
    exit 2
  fi
  exit 0
}

main
