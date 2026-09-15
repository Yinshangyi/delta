import { fileURLToPath, URL } from "node:url"

import react from "@vitejs/plugin-react"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

/**
 * Two projects, chosen by filename suffix. The domain is pure functions over
 * arrays and has no reason to pay for a browser; components cannot be tested
 * without one.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node:unit",
          environment: "node",
          include: ["src/**/*.node.unit.test.ts"],
          setupFiles: ["./vitest.node.setup.ts"]
        }
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "browser:unit",
          include: ["src/**/*.browser.unit.test.tsx"],
          setupFiles: ["./vitest.browser.setup.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }]
          }
        }
      }
    ]
  }
})
