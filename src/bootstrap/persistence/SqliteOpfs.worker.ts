/// <reference lib="webworker" />
/**
 * SQLite's OPFS VFS needs synchronous access handles, which exist only off the
 * main thread. That is why the database is a worker at all.
 */
import { OpfsWorker } from "@effect/sql-sqlite-wasm"
import { Effect } from "effect"

// `run` owns the VFS and the database handle, and does not complete until the
// client sends `close` — so fork it and let it serve.
Effect.runFork(
  OpfsWorker.run({
    // DedicatedWorkerGlobalScope.postMessage has a different overload shape than
    // MessagePort's; structurally incompatible to TypeScript, identical at runtime.
    // ast-grep-ignore: no-unsafe-cast
    port: self as unknown as OpfsWorker.OpfsWorkerConfig["port"],
    dbName: "delta.db"
  })
)
