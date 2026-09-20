import { defineConfig } from "oxlint"

import { nestingBudget } from "./tools/gates/NestingBudget.ts"
import {
  componentScope,
  componentSizeBudgets,
  exemptFromSizeBudgets,
  sizeBudgets,
  sizeBudgetScope
} from "./tools/gates/SizeBudgets.ts"

/**
 * Hexagon boundaries are dependency-cruiser's job, not oxlint's — see
 * `.dependency-cruiser.cjs`. The `eslint-plugin-boundaries` gate was measured
 * at 54s in the reference project and is not worth it at this size.
 */
export default defineConfig({
  plugins: ["unicorn", "typescript", "oxc", "import", "vitest"],
  settings: {
    "import/resolver": { typescript: { alwaysTryTypes: true }, node: true }
  },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "import/no-cycle": ["error", { ignoreExternal: true }],
    "no-unused-vars": "error",
    "dot-notation": "error",
    "no-console": "error",
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "effect",
            importNames: ["Either"],
            message: "Effect v4 renamed Either to Result. Use Result.succeed / Result.fail."
          }
        ]
      }
    ]
  },
  overrides: [
    {
      // Deliberately these rules and not `max-depth`: it counts nested BLOCK
      // statements, and on Effect pipeline code — where the nesting is
      // callbacks and expressions — it cannot fire.
      files: [...sizeBudgetScope],
      rules: { ...sizeBudgets, ...nestingBudget }
    },
    {
      // A component is one function whose length is mostly markup, so the file
      // budget is raised and the per-function one dropped.
      files: [...componentScope],
      rules: { ...componentSizeBudgets, "max-lines-per-function": "off" }
    },
    {
      // Off rather than raised: there is no number at which a self-sufficient
      // test arrange block is too long.
      files: [...exemptFromSizeBudgets],
      rules: {
        "max-lines": "off",
        "max-lines-per-function": "off",
        "max-nested-callbacks": "off"
      }
    },
    {
      /**
       * A `Date` anywhere in the domain reintroduces the host timezone the
       * LocalDate/YearMonth types exist to keep out (spec §56).
       */
      files: ["src/shared/domain/**/*.ts", "src/modules/*/core/**/*.ts"],
      rules: {
        "no-restricted-globals": [
          "error",
          {
            name: "Date",
            message:
              "The domain is timezone-free. Use LocalDate or YearMonth; inject a clock for 'now'."
          }
        ]
      }
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      rules: {
        "vitest/prefer-strict-equal": "error",
        "vitest/prefer-to-be": "error",
        "vitest/prefer-to-contain": "error",
        "vitest/prefer-to-have-length": "error",
        "vitest/prefer-comparison-matcher": "error",
        "vitest/prefer-equality-matcher": "error",
        "vitest/prefer-called-once": "error",
        "vitest/no-conditional-in-test": "error",
        "vitest/no-conditional-expect": "error",
        "vitest/no-focused-tests": "error",
        "vitest/no-disabled-tests": "error",
        "vitest/no-identical-title": "error",
        /**
         * Off: @effect/vitest's `layer(...)("name", (it) => ...)` wrapper is not
         * a test block oxlint recognises, so every assertion inside one reads as
         * standalone.
         */
        "vitest/no-standalone-expect": "off",
        "vitest/expect-expect": "error",
        "vitest/valid-expect": "error",
        "vitest/valid-title": "error",
        "vitest/require-top-level-describe": "error"
      }
    }
  ]
})
