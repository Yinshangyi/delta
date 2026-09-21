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
  devshell_recorded="$(cat "$devshell_path_file")"
  PATH="$devshell_recorded:$PATH"
  export PATH

  # The file records absolute /nix/store paths, and the store is
  # garbage-collected. A snapshot from a collected generation leaves a PATH
  # full of directories that no longer exist — every gate then quietly finds
  # nothing and passes, which is the one failure this whole file exists to
  # prevent.
  #
  # Every store entry is checked, not just the first. A collection takes
  # whatever is unreachable and leaves the rest, so a PATH can keep node and
  # lose lefthook — and a guard that reads entry one and reports success is the
  # same silent pass wearing a check. Both have happened here.
  devshell_missing=""
  devshell_missing_count=0
  devshell_rest="$devshell_recorded"
  while [ -n "$devshell_rest" ]; do
    devshell_entry="${devshell_rest%%:*}"
    case "$devshell_rest" in
      *:*) devshell_rest="${devshell_rest#*:}" ;;
      *) devshell_rest="" ;;
    esac
    # Only /nix/store entries matter. A recorded PATH also carries ambient
    # system directories, and several of those legitimately do not exist on a
    # given Mac — warning about them trains the reader to ignore the warning,
    # which costs more than the check buys.
    case "$devshell_entry" in
      /nix/store/*) ;;
      *) continue ;;
    esac
    [ -d "$devshell_entry" ] && continue
    devshell_missing_count=$((devshell_missing_count + 1))
    [ -n "$devshell_missing" ] || devshell_missing="$devshell_entry"
  done

  if [ -n "$devshell_missing" ]; then
    echo "[devshell] $devshell_path_file points at tools that no longer exist (missing directories: $devshell_missing_count), starting with $devshell_missing." >&2
    echo "[devshell] The nix store has been garbage-collected since it was written, so some gates cannot find their tools and would skip in silence. Run \`direnv allow\` (or \`nix develop\`) once in the project to rebuild it." >&2
  fi
else
  echo "[devshell] $devshell_path_file is missing: run \`direnv allow\` (or \`nix develop\`) once in the project so the edit gates can find their tools." >&2
fi
