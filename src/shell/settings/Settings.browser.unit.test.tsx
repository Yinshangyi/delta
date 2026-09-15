import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SettingsScreen, SettingsSection } from "@/shell/settings/SettingsScreen"
import { SETTINGS_COPY } from "@/shell/settings/SettingsVocabulary"
import { StoragePanel } from "@/shell/settings/StoragePanel"

describe("the settings screen", () => {
  it("separates its concerns into headed sections, not one long form", () => {
    render(
      <SettingsScreen>
        <SettingsSection title="Appearance" description="a">
          <p>one</p>
        </SettingsSection>
        <SettingsSection title="Storage" description="b">
          <p>two</p>
        </SettingsSection>
      </SettingsScreen>
    )

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Appearance" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Storage" })).toBeInTheDocument()
  })
})

describe("the storage panel", () => {
  it("says plainly when the browser has promised to keep the data", () => {
    render(<StoragePanel persisted usedBytes={1_572_864} quotaBytes={2_147_483_648} />)
    expect(screen.getByText(SETTINGS_COPY.storage.persistent)).toBeInTheDocument()
  })

  it("reports usage in units a person can read", () => {
    render(<StoragePanel persisted usedBytes={1_572_864} quotaBytes={2_147_483_648} />)
    expect(screen.getByText("Using 1.5 MB of 2 GB available")).toBeInTheDocument()
  })

  it("points at the export when the browser has not promised", () => {
    render(<StoragePanel persisted={false} usedBytes={1_024} quotaBytes={undefined} />)
    const warning = screen.getByText(SETTINGS_COPY.storage.notPersistent)
    expect(warning).toBeInTheDocument()
    expect(warning.textContent).toContain("keep an export")
  })

  it("says so when the browser will not report usage at all", () => {
    render(<StoragePanel persisted usedBytes={undefined} quotaBytes={undefined} />)
    expect(screen.getByText(SETTINGS_COPY.storage.unknown)).toBeInTheDocument()
  })
})
