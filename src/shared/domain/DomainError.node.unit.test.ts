import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

import { Result } from "effect"
import { describe, expect, it } from "vitest"

import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as DomainError from "@/shared/domain/DomainError"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as PersistenceError from "@/shared/domain/PersistenceError"

const failure = <A, E>(result: Result.Result<A, E>): E => Result.getOrThrow(Result.flip(result))

const euros = (value: number): Money.Money => Result.getOrThrow(Money.fromEuros(value))

describe("BillableDays", () => {
  it("accepts a whole number of days in a month", () => {
    expect(BillableDays.toNumber(Result.getOrThrow(BillableDays.fromNumber(20)))).toBe(20)
    expect(BillableDays.toNumber(BillableDays.zero)).toBe(0)
  })

  it("rejects a fraction of a day", () => {
    expect(failure(BillableDays.fromNumber(20.5)).reason).toBe("not-a-whole-number")
  })

  it("rejects more days than a month has", () => {
    expect(failure(BillableDays.fromNumber(32)).reason).toBe("out-of-range")
    expect(failure(BillableDays.fromNumber(-1)).reason).toBe("out-of-range")
  })
})

describe("DailyRate", () => {
  it("computes the revenue of spec §9 exactly", () => {
    // €600 x 20 days = €12,000 HT.
    const rate = Result.getOrThrow(DailyRate.fromEuros(600))
    const days = Result.getOrThrow(BillableDays.fromNumber(20))
    expect(DailyRate.revenueFor(rate, days)).toBe(Money.toCents(euros(12_000)))
  })

  it("rejects a rate of zero or less, which would silently flatten the projection", () => {
    expect(failure(DailyRate.fromEuros(0)).reason).toBe("not-positive")
    expect(failure(DailyRate.fromEuros(-100)).reason).toBe("not-positive")
  })

  it("rejects an amount Money itself would reject", () => {
    expect(failure(DailyRate.fromEuros(600.005)).reason).toBe("invalid-amount")
  })
})

describe("PayoutRatio", () => {
  it("applies the development assumption of spec §9", () => {
    // €12,000 x 80% = €9,600.
    expect(PayoutRatio.applyTo(euros(12_000), PayoutRatio.developmentAssumption)).toBe(
      Money.toCents(euros(9_600))
    )
  })

  it("is configurable, not a universal rule", () => {
    const conservative = Result.getOrThrow(PayoutRatio.fromPercent(65))
    expect(PayoutRatio.applyTo(euros(10_000), conservative)).toBe(Money.toCents(euros(6_500)))
  })

  it("rejects a ratio outside 0% to 100%", () => {
    expect(failure(PayoutRatio.fromPercent(120)).reason).toBe("out-of-range")
  })
})

describe("PersistenceError", () => {
  it("names the operation in domain language and keeps the cause out of it", () => {
    const error = PersistenceError.wrap("load holdings")(
      new Error("SQLITE_BUSY: database is locked")
    )
    expect(error._tag).toBe("PersistenceError")
    expect(error.operation).toBe("load holdings")
  })
})

describe("the catalogue of spec §54", () => {
  it("names every error the spec lists", () => {
    const named = [
      "InvalidMoney",
      "InvalidDailyRate",
      "InvalidBillableDays",
      "InvalidPayoutRatio",
      "InvalidDebtBalance",
      "InvalidPaymentSchedule",
      "InvalidGoal",
      "PersistenceError"
    ]
    const exported = Object.keys(DomainError)
    for (const name of named) expect(exported).toContain(name)
  })

  it("gives every error a distinct tag", () => {
    const tags = [
      new DomainError.InvalidDebtBalance({ value: -1, reason: "negative" })._tag,
      new DomainError.InvalidPaymentSchedule({ reason: "never-amortises" })._tag,
      new DomainError.InvalidGoal({ reason: "not-positive" })._tag
    ]
    expect(new Set(tags).size).toBe(tags.length)
  })
})

/**
 * Walks src/, skipping tests — a test may throw to fail a broken fixture — and
 * skipping the entry point. A missing #root element is a defect, not an
 * expected failure: there is no caller to return a Result to, and nothing can
 * run without it.
 */
const productionSources = async (directory: string): Promise<ReadonlyArray<string>> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const found: Array<string> = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      found.push(...(await productionSources(path)))
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !entry.name.includes(".test.") &&
      entry.name !== "main.tsx"
    ) {
      found.push(path)
    }
  }
  return found
}

describe("expected failures are values, not exceptions", () => {
  it("has no `throw` in production code outside the entry point", async () => {
    const paths = await productionSources(join(process.cwd(), "src"))
    const read = await Promise.all(
      paths.map(async (path) => [path, await readFile(path, "utf8")] as const)
    )
    const offenders = read
      .filter(([, contents]) => /^\s*throw\s/m.test(contents))
      .map(([path]) => path)
    expect(offenders).toStrictEqual([])
  })
})
