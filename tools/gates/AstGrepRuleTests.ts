import { contentsOf, filesMatching } from "./RepositoryFiles.ts"

// Where sgconfig.yml points `ruleDirs` and `testConfigs`. Restated as globs because the gate has
// to enumerate both sides itself; the emptiness check below is what reports a move rather than
// comparing two empty sets and passing.
const ruleFiles = ".config/ast-grep/rules/**/*.yml"
const ruleTestFiles = ".config/ast-grep/rule-tests/**/*.yml"

const configFile = ".config/ast-grep/sgconfig.yml"

// A line scan, not a YAML parse: this runs beside `ast-grep test` in the same gate, and the two
// directories it reads are the ones ast-grep would have to be able to read anyway.
const declaredId = /^id:\s*(?<id>\S+)\s*$/gm

const idsDeclaredIn = (pattern: string) =>
  filesMatching([pattern]).flatMap((path) =>
    [...contentsOf(path).matchAll(declaredId)].flatMap((match) => match.groups?.["id"] ?? [])
  )

const idsMissingFrom = (ids: ReadonlyArray<string>, counterparts: ReadonlyArray<string>) => {
  const present = new Set(counterparts)
  return ids.filter((id) => !present.has(id)).toSorted()
}

// `ast-grep test` skips a test case whose id names no rule, and a rule nothing names is never
// tested. Both are silent and both exit 0, so a deleted rule takes its enforcement with it while
// every gate stays green. The rule-tests are a tripwire only while each id on one side has a
// partner on the other.
const ruleIds = idsDeclaredIn(ruleFiles)
const testedIds = idsDeclaredIn(ruleTestFiles)

const problems = [
  ruleIds.length === 0
    ? [
        `No rule declares an id under ${ruleFiles}. Either the whole idiom gate is gone or` +
          ` ${configFile} points \`ruleDirs\` somewhere this gate does not read, and a scan that` +
          ` loads no rules reports nothing and passes.\nPoint \`ruleFiles\` in this file at the` +
          ` directory \`ruleDirs\` names.`
      ]
    : [],
  testedIds.length === 0
    ? [
        `No test case declares an id under ${ruleTestFiles}. Either the rules have no tests at` +
          ` all or ${configFile} points \`testConfigs\` somewhere this gate does not read, and a` +
          ` test run with no cases passes.\nPoint \`ruleTestFiles\` in this file at the directory` +
          ` \`testConfigs\` names.`
      ]
    : [],
  idsMissingFrom(testedIds, ruleIds).length > 0
    ? [
        `These ids are tested but no rule declares them: ${idsMissingFrom(testedIds, ruleIds).join(", ")}.` +
          ` \`ast-grep test\` skips a case whose id names no rule and still exits 0, so whatever` +
          ` those rules forbade is no longer forbidden and nothing reports it.\nRestore the rule,` +
          ` or delete its test cases in the same change so the pair stays honest.`
      ]
    : [],
  idsMissingFrom(ruleIds, testedIds).length > 0
    ? [
        `These rules have no test case: ${idsMissingFrom(ruleIds, testedIds).join(", ")}. A rule` +
          ` that matches nothing reports nothing, which reads exactly like a clean tree, and` +
          ` without a case pinning one violation and one permitted spelling there is nothing to` +
          ` catch that.\nAdd a case under ${ruleTestFiles} with both a \`valid\` and an \`invalid\`` +
          ` entry.`
      ]
    : []
].flat()

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n\n")}\n`)
}
process.exitCode = problems.length > 0 ? 1 : 0
