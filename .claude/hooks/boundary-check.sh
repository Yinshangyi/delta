#!/usr/bin/env bash
# Runs dependency-cruiser on the file just edited and exits 2 on a hexagon
# violation.
#
# At edit time rather than pre-push because the whole deferred-distribution
# argument in architecture.md rests on these boundaries holding — and a
# violation is far cheaper to fix in the turn that wrote it.
set -u
# shellcheck source=/dev/null
. "$(dirname "$0")/_edited-file.sh"

main() {
  command -v jq >/dev/null 2>&1 || {
    echo "boundary-check: jq not found; skipping" >&2
    exit 0
  }
  command -v pnpm >/dev/null 2>&1 || {
    echo "boundary-check: pnpm not found; skipping" >&2
    exit 0
  }

  local file project_dir relative out
  file=$(edited_file) || exit 0
  project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
  in_project "$file" "$project_dir" || exit 0
  case "$file" in *.ts | *.tsx) ;; *) exit 0 ;; esac
  case "$file" in *.test.ts | *.test.tsx) exit 0 ;; esac

  cd "$project_dir" || exit 0
  relative="${file#"$project_dir"/}"
  case "$relative" in src/*) ;; *) exit 0 ;; esac

  # Cruising one file still follows its imports, so an illegal edge from it is
  # found; edges *into* it are the whole-tree run's job (CI, pre-push).
  if ! out=$(pnpm exec depcruise "$relative" 2>&1); then
    printf '%s\n' "$out" >&2
    exit 2
  fi
  exit 0
}

main
