#!/usr/bin/env bash
# Runs one Claude Code hook — `tools/hooks/<name>.ts` — with the dev shell's node.
#
# The only part of a hook that cannot be TypeScript: Claude Code may run outside the nix dev shell,
# and then there is no node to run the rest with until devshell-path.sh puts the shell's tools on
# PATH. Node runs the .ts file directly; nothing is compiled.
root="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=../../nix/devshell-path.sh
source "$root/nix/devshell-path.sh"
command -v node >/dev/null 2>&1 || exit 0
exec node "$root/tools/hooks/$1.ts"
