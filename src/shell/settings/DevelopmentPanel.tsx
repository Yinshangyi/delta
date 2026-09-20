import { useAtomSet, useAtomValue } from "@effect/atom-react"
import { Exit, Match } from "effect"
import { useState } from "react"

import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { seedDevelopmentData } from "@/bootstrap/seed/DevelopmentSeed"
import { deleteDatabaseFile, resetToSeed } from "@/bootstrap/seed/ResetDevelopmentDatabase"
import { Button } from "@/dsl/Button"
import { today } from "@/shared/presentation/Today"
import { resolveMutation } from "@/shared/reactivity/AsyncState"

import type { AsyncState } from "@/shared/reactivity/AsyncState"

const seedAtom = appRuntime.fn<string>()((on) => seedDevelopmentData(on))
const resetAtom = appRuntime.fn<string>()((on) => resetToSeed(on))
const dropAtom = appRuntime.fn<void>()(() => deleteDatabaseFile())

const busyOf = <A,>(state: AsyncState<A, unknown>): boolean =>
  Match.valueTags(state, {
    Idle: () => false,
    Loading: () => true,
    Success: () => false,
    Failure: () => false,
    Defect: () => false
  })

/**
 * Development-only (DAT-03, DAT-04, spec §51). The whole section is behind
 * `import.meta.env.DEV`, which Vite resolves at build time — so a production
 * bundle does not merely hide these controls, it does not contain them, and
 * cannot seed by accident.
 */
export function DevelopmentPanel() {
  const [note, setNote] = useState<string | undefined>(undefined)

  const seeding = resolveMutation(useAtomValue(seedAtom))
  const runSeed = useAtomSet(seedAtom, { mode: "promiseExit" })
  const resetting = resolveMutation(useAtomValue(resetAtom))
  const runReset = useAtomSet(resetAtom, { mode: "promiseExit" })
  const runDrop = useAtomSet(dropAtom, { mode: "promiseExit" })

  const busy = busyOf(seeding) || busyOf(resetting)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Only in a development build. None of this exists in a production bundle.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() => {
            void runSeed(today()).then((exit) => {
              if (!Exit.isSuccess(exit)) return
              setNote(exit.value === "seeded" ? "Seeded." : "Already has data — nothing was added.")
              if (exit.value === "seeded") globalThis.location.reload()
            })
          }}
        >
          Seed if empty
        </Button>

        <Button
          disabled={busy}
          onClick={() => {
            void runReset(today()).then((exit) => {
              if (Exit.isSuccess(exit)) globalThis.location.reload()
            })
          }}
        >
          Reset to seed data
        </Button>

        <Button
          disabled={busy}
          onClick={() => {
            void runDrop().then((exit) => {
              if (Exit.isSuccess(exit)) globalThis.location.reload()
              else setNote("Could not delete the file — close other tabs and try again.")
            })
          }}
        >
          Delete the database
        </Button>
      </div>

      <p className="text-muted text-xs">
        Seeding adds nothing to a database that already has a household. Reset empties every table
        first. Deleting the file re-runs every migration on the next load, which is the one that
        would catch a migration bug.
      </p>

      {note === undefined ? null : <p className="text-ink text-sm">{note}</p>}
    </div>
  )
}
