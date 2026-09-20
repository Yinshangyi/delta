{ pkgs }:

let
  rtk = pkgs.callPackage ./rtk.nix { };
in
pkgs.mkShell {
  packages = [
    pkgs.nodejs_latest
    # Provides the `pnpm` shim, which reads `packageManager` from package.json
    # and fetches that exact version. pnpm itself is never installed by hand.
    pkgs.corepack
    pkgs.git
    # Installs the pre-commit and pre-push gates on shell entry.
    pkgs.lefthook
    # Trims the output of common dev commands before it reaches the model.
    rtk
  ];

  shellHook = ''
    # Keep corepack's downloads inside the project rather than ~/Library.
    export COREPACK_HOME="$PWD/.cache/corepack"
    # The version comes from package.json's `packageManager`; don't ask to confirm it.
    export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

    # Keep rtk's history inside the project rather than ~/Library, and send nothing anywhere.
    export RTK_DB_PATH="$PWD/.claude/cache/rtk/history.db"
    export RTK_TELEMETRY_DISABLED=1
    mkdir -p "$PWD/.claude/cache/rtk" && chmod 700 "$PWD/.claude/cache/rtk"

    # Install the git hooks (lefthook.yml) on shell entry.
    lefthook install --force > /dev/null 2>&1 || true

    # Record this shell's PATH so the Claude Code hooks find the same node and
    # tools when Claude Code was not started from the shell — which the desktop
    # app never is. See nix/devshell-path.sh.
    mkdir -p "$PWD/.direnv" && printf '%s' "$PATH" > "$PWD/.direnv/devshell-path"
  '';
}
