import { globSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

// A gate reading the tree it runs in has no Effect runtime to sit inside and nothing an injected fake
// could stand in for, which is what the rule against native `node:fs` in the app protects.
//
// From this file's own location rather than from `process.cwd()`, because every path these helpers
// take is repository-root-relative, and a task run from `app/` would otherwise scan a tree that holds
// none of what it names — which reads as a clean scan rather than as a gate that missed.
const repositoryRoot = resolve(import.meta.dirname, "../..")

// `globSync` on purpose: re-deriving `**`-vs-`*` by hand is how a coverage gate under-matches, and an
// under-matching gate reads exactly like a configuration with nothing to report.
export const filesMatching = (patterns: ReadonlyArray<string>) =>
  globSync([...patterns], { cwd: repositoryRoot, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `${entry.parentPath}/${entry.name}`.slice(repositoryRoot.length + 1))

export const contentsOf = (relativePath: string) =>
  readFileSync(`${repositoryRoot}/${relativePath}`, "utf8")
