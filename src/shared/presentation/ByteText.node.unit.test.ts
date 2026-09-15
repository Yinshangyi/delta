import { describe, expect, it } from "vitest"

import { bytes } from "@/shared/presentation/ByteText"

describe("storage figures", () => {
  it("scale the unit rather than growing the number", () => {
    expect(bytes(512)).toBe("512 byte")
    expect(bytes(1_536)).toBe("1.5 kB")
    expect(bytes(1_572_864)).toBe("1.5 MB")
    expect(bytes(2_147_483_648)).toBe("2 GB")
  })

  it("keeps one decimal at most, because this is orientation not accounting", () => {
    expect(bytes(1_234_567)).toBe("1.2 MB")
  })

  it("does not fall over on zero", () => {
    expect(bytes(0)).toBe("0 byte")
  })

  it("stops at gigabytes rather than inventing a unit", () => {
    expect(bytes(5 * 1024 ** 4)).toBe("5,120 GB")
  })
})
