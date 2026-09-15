import { Cause } from "effect"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { describe, expect, it } from "vitest"

import { AsyncState, resolveMutation, resolveStream } from "@/shared/reactivity/AsyncState"

class LoadFailed extends Error {
  override readonly name = "LoadFailed"
}

const failure = <A, E>(error: E, waiting = false): AsyncResult.AsyncResult<A, E> =>
  AsyncResult.failure(Cause.fail(error), { waiting })

const defect = <A, E>(thrown: unknown): AsyncResult.AsyncResult<A, E> =>
  AsyncResult.failure(Cause.die(thrown))

describe("a command atom", () => {
  it("has done nothing yet before it is fired", () => {
    expect(resolveMutation(AsyncResult.initial())).toStrictEqual(AsyncState.Idle)
  })

  it("is loading while in flight", () => {
    expect(resolveMutation(AsyncResult.initial(true))).toStrictEqual(AsyncState.Loading)
  })

  it("is loading again on a retry, rather than frozen on the last outcome", () => {
    const retrying = AsyncResult.success(1, { waiting: true })
    expect(resolveMutation(retrying)).toStrictEqual(AsyncState.Loading)
  })

  it("surfaces the value on success", () => {
    expect(resolveMutation(AsyncResult.success(42))).toStrictEqual(AsyncState.Success(42))
  })

  it("surfaces a typed error as a failure the screen can explain", () => {
    const error = new LoadFailed("no household")
    expect(resolveMutation(failure(error))).toStrictEqual(AsyncState.Failure(error))
  })
})

describe("a query atom", () => {
  it("is loading before the first emission", () => {
    expect(resolveStream(AsyncResult.initial())).toStrictEqual(AsyncState.Loading)
  })

  it("keeps showing the value while the stream stays open", () => {
    // The runtime marks every emission `waiting` because the stream never ends.
    // Reading `waiting` here would report Loading forever.
    const open = AsyncResult.success(7, { waiting: true })
    expect(resolveStream(open)).toStrictEqual(AsyncState.Success(7))
  })

  it("surfaces a typed error", () => {
    const error = new LoadFailed("database unavailable")
    expect(resolveStream(failure(error))).toStrictEqual(AsyncState.Failure(error))
  })
})

describe("a defect", () => {
  it("arrives as an Error, whatever was actually thrown", () => {
    const resolved = resolveStream(defect("boom"))
    expect(resolved._tag).toBe("Defect")
    expect(resolved).toStrictEqual(AsyncState.Defect(new Error("boom")))
  })

  it("keeps a real Error untouched, so its stack survives", () => {
    const thrown = new Error("worker died")
    expect(resolveStream(defect(thrown))).toStrictEqual(AsyncState.Defect(thrown))
  })

  it("is distinct from a typed failure, because only one of them is expected", () => {
    const expected = resolveStream(failure(new LoadFailed("no rows")))
    const unexpected = resolveStream(defect("worker died"))
    expect(expected._tag).toBe("Failure")
    expect(unexpected._tag).toBe("Defect")
  })
})

describe("the vocabulary", () => {
  it("is the five variants a screen has to render, and no more", () => {
    const tags = [
      AsyncState.Idle._tag,
      AsyncState.Loading._tag,
      AsyncState.Success(1)._tag,
      AsyncState.Failure("e")._tag,
      AsyncState.Defect(new Error("d"))._tag
    ]
    expect(tags).toStrictEqual(["Idle", "Loading", "Success", "Failure", "Defect"])
  })
})
