import { Option } from "effect"

export interface RewriteOutcome {
  readonly original: string
  readonly rewritten: string
  /** `rtk rewrite`'s answer — 0: rewritten, nothing objects; 1: no rtk equivalent; 2: a deny rule
   * matched; 3: an ask rule matched. */
  readonly exitCode: number
}

export interface Rewrite {
  readonly command: string
  /** Allowed without a prompt; otherwise Claude Code asks, as the matching ask rule wants. */
  readonly autoAllowed: boolean
}

/**
 * What to hand back to Claude Code. A command rtk already runs, one it has no equivalent for, and one
 * a deny rule matched all pass through unchanged — Claude Code's own permissions then decide.
 */
export const rewriteOf = ({
  original,
  rewritten,
  exitCode
}: RewriteOutcome): Option.Option<Rewrite> =>
  exitCode === 0 && rewritten !== original
    ? Option.some({ command: rewritten, autoAllowed: true })
    : exitCode === 3
      ? Option.some({ command: rewritten, autoAllowed: false })
      : Option.none()

export interface RtkSetting {
  readonly command: string
  readonly rtkDirectory: string
  readonly projectDirectory: string
}

/**
 * The rewritten command, carrying rtk's directory and settings with it. It runs in Claude Code's Bash
 * environment, which is not the dev shell when Claude Code was started outside it, so `rtk` would not
 * be found there; and rtk's history stays inside the project.
 */
export const withRtkSetting = ({ command, rtkDirectory, projectDirectory }: RtkSetting) =>
  `export PATH="${rtkDirectory}":"$PATH" RTK_DB_PATH="${projectDirectory}/.claude/cache/rtk/history.db" RTK_TELEMETRY_DISABLED=1; ${command}`
