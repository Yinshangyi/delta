import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

/**
 * Testing Library only auto-cleans when it detects a global `afterEach`, and
 * this project imports its test functions explicitly. Without this, a mounted
 * tree from one test is still in the document during the next.
 */
afterEach(() => {
  cleanup()
})
