#!/usr/bin/env bash
# Sourced by every Claude Code hook: puts the dev shell's tools on PATH.
#
# A hook inherits them only when whatever started it was itself started from inside the shell, and
# the desktop app never is. Without this the hooks fall back to a dependency check, skip themselves
# in silence, and every edit reads as clean — which is worse than having no hooks, because it looks
# like having some.
#
# The shell writes its PATH to .direnv/devshell-path on entry (nix/devshell.nix); entering it once
# after a flake change keeps the file current.
devshell_root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
devshell_path_file="$devshell_root/.direnv/devshell-path"

if [ -r "$devshell_path_file" ]; then
  PATH="$(cat "$devshell_path_file"):$PATH"
  export PATH
else
  echo "[devshell] $devshell_path_file is missing: run \`direnv allow\` (or \`nix develop\`) once in the project so the edit gates can find their tools." >&2
fi
