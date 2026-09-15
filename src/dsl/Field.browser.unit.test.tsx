import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Field, TextInput } from "@/dsl/Field"

describe("a field", () => {
  it("ties its label to its control", () => {
    render(<Field label="Daily rate">{(ids) => <TextInput {...ids} />}</Field>)
    expect(screen.getByLabelText("Daily rate")).toBeInTheDocument()
  })

  it("reads its hint out as part of the control", () => {
    render(
      <Field label="Daily rate" hint="Excluding VAT">
        {(ids) => <TextInput {...ids} />}
      </Field>
    )
    expect(screen.getByLabelText("Daily rate")).toHaveAccessibleDescription("Excluding VAT")
  })

  it("marks the control invalid when there is an error, not only colours it", () => {
    render(
      <Field label="Daily rate" error="Must be more than zero">
        {(ids) => <TextInput {...ids} invalid />}
      </Field>
    )
    const input = screen.getByLabelText("Daily rate")
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription("Must be more than zero")
  })
})
