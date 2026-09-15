/**
 * The hexagon, enforced. Every rule here restates a line from architecture.md;
 * if the two ever disagree, the document is the intent and this file is the
 * truth, so fix the file.
 *
 * Rules are pure path globs, so a new module obeys them the day it is created
 * without anyone editing this config.
 *
 *
 * A module is a hexagon. Source dependencies point INWARD, always.
 *
 *      primary_adapters/                              secondary_adapters/
 *      react/ · reactivity/                           *Live.ts · *Stub.ts
 *              │                                               │
 *              │ calls                            implements   │
 *              ▼                                               ▼
 *   ┌──────────────────────────  core/  ───────────────────────────────┐
 *   │                                                                  │
 *   │     ports/primary/                        ports/secondary/       │
 *   │     (*UseCase)                            (intent-named)         │
 *   │          │                                        ▲              │
 *   │          ▼                                        │              │
 *   │     use_cases/  ──────────────────────────────────┘              │
 *   │          │                                                       │
 *   │          ▼                                                       │
 *   │     domain/                                                      │
 *   │          │                                                       │
 *   └──────────┼───────────────────────────────────────────────────────┘
 *              ▼
 *      shared/domain/     Money · Percentage · LocalDate · YearMonth · CashFlow
 *                         (depends on nothing of ours but itself)
 *
 *
 * Every arrow below is forbidden, by the rule named on the left.
 *
 *   core-no-adapters                 core/               ──✗──►  either adapter ring
 *   core-no-framework                core/               ──✗──►  react · @effect/atom*
 *   core-no-reactivity               core/               ──✗──►  effect/…/reactivity
 *   primary-no-secondary             primary_adapters/   ──✗──►  secondary_adapters/
 *   secondary-only-secondary-ports   secondary_adapters/ ──✗──►  core/, bar the ports
 *   shared-domain-is-a-leaf          shared/domain/      ──✗──►  anything of ours but itself
 *   domain-no-sql                    anywhere else       ──✗──►  @effect/sql-* · wa-sqlite
 *   no-circular                      anything            ──✗──►  itself, transitively
 *
 *   The first three also cover shared/domain/.
 *
 * The composition root is where the two sides finally meet:
 * bootstrap/runtime/AppLayer.ts, and nowhere else.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "core-no-adapters",
      comment:
        "core/** must not import an adapter. Martin's dependency rule points inward: " +
        "a use case that knows its adapter cannot be tested without it, and cannot be " +
        "re-pointed at a different one.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/core/" },
      to: { path: "^src/modules/[^/]+/(primary_adapters|secondary_adapters)/" }
    },
    {
      name: "core-no-framework",
      comment:
        "core/** must not import React or any reactivity primitive. Atom is a " +
        "primary-adapter concern; importing it into core makes the domain untestable " +
        "without a renderer.",
      severity: "error",
      from: { path: "^src/(modules/[^/]+/core|shared/domain)/" },
      to: {
        dependencyTypes: ["npm", "npm-dev", "npm-peer"],
        path: "/node_modules/(react|react-dom|@effect/atom|@effect/atom-react)(/|$)"
      }
    },
    {
      name: "core-no-reactivity",
      comment:
        "core/** must not import effect's reactivity module — same reason as React. " +
        "SubscriptionRef and Queue live inside Layer.effect bodies, never on a port.",
      severity: "error",
      from: { path: "^src/(modules/[^/]+/core|shared/domain)/" },
      to: { path: "/node_modules/effect/.*/unstable/reactivity/" }
    },
    {
      name: "primary-no-secondary",
      comment:
        "primary_adapters/** must not import secondary_adapters/**. The two sides of " +
        "the hexagon meet at the composition root, not in a component.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/primary_adapters/" },
      to: { path: "^src/modules/[^/]+/secondary_adapters/" }
    },
    {
      name: "secondary-only-secondary-ports",
      comment:
        "secondary_adapters/** may reach core only through core/ports/secondary/**. " +
        "An adapter that imports a use case has the arrow backwards.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/secondary_adapters/" },
      to: {
        path: "^src/modules/[^/]+/core/",
        pathNot: "^src/modules/[^/]+/core/ports/secondary/"
      }
    },
    {
      name: "shared-domain-is-a-leaf",
      comment:
        "shared/domain/** is the vocabulary every module speaks. It must depend on " +
        "nothing of ours but itself, or it stops being shareable.",
      severity: "error",
      from: { path: "^src/shared/domain/" },
      to: { path: "^src/", pathNot: "^src/shared/domain/" }
    },
    {
      name: "domain-no-sql",
      comment:
        "No SQL client outside secondary_adapters/** and bootstrap/persistence/**. " +
        "Persistence is a detail the domain must not learn.",
      severity: "error",
      from: {
        path: "^src/",
        pathNot: "^src/(modules/[^/]+/secondary_adapters|bootstrap/persistence)/"
      },
      to: {
        dependencyTypes: ["npm", "npm-dev", "npm-peer"],
        path: "/node_modules/(@effect/sql-sqlite-wasm|@effect/wa-sqlite)(/|$)"
      }
    },
    {
      name: "no-circular",
      comment:
        "No import cycles, within a module or between them. A cycle means the two " +
        "files are one unit that has not admitted it yet.",
      severity: "error",
      from: {},
      to: { circular: true }
    },
    {
      name: "no-orphans",
      comment: "An unreachable module is dead code or a missing wire-up.",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "^src/main\\.tsx$",
          "(^|/)[^/]+\\.worker\\.ts$",
          // Loaded by import.meta.glob, which is invisible to static analysis.
          "^src/bootstrap/persistence/migrations/"
        ]
      },
      to: {}
    }
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    /**
     * node_modules is `doNotFollow`, not `exclude`: excluding it drops those
     * modules from the graph entirely, and a rule cannot forbid an edge to a
     * node that is not there.
     */
    exclude: { path: ["^dist/"] },
    /** Resolve `@/`, and treat `import type` across a boundary as a violation too. */
    tsConfig: { fileName: "tsconfig.base.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require"] }
  }
}
