{ pkgs }:

pkgs.mkShell {
  packages = [
    pkgs.nodejs_latest
    # Provides the `pnpm` shim, which reads `packageManager` from package.json
    # and fetches that exact version. pnpm itself is never installed by hand.
    pkgs.corepack
    pkgs.git
  ];

  shellHook = ''
    # Keep corepack's downloads inside the project rather than ~/Library.
    export COREPACK_HOME="$PWD/.cache/corepack"
    # The version comes from package.json's `packageManager`; don't ask to confirm it.
    export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

    # Record this shell's PATH so the Claude Code hooks find the same node and
    # tools when Claude Code was not started from the shell — which the desktop
    # app never is. See nix/devshell-path.sh.
    mkdir -p "$PWD/.direnv" && printf '%s' "$PATH" > "$PWD/.direnv/devshell-path"
  '';
}
