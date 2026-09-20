import { useAtomValue } from "@effect/atom-react"
import { Match } from "effect"

import { FailureState } from "@/dsl/FailureState"
import { HouseholdContainer } from "@/modules/household/primary_adapters/react/HouseholdContainer"
import { resolveStream } from "@/shared/reactivity/AsyncState"
import { storageAtom } from "@/shell/settings/SettingsAtoms"
import { SettingsScreen, SettingsSection } from "@/shell/settings/SettingsScreen"
import { SETTINGS_COPY } from "@/shell/settings/SettingsVocabulary"
import { StoragePanel } from "@/shell/settings/StoragePanel"
import { useTheme } from "@/shell/theme/useTheme"
import { ThemeControl } from "@/shell/ThemeControl"

/**
 * Reads atoms, forwards values as props, renders leaves. Every one of the five
 * AsyncState variants is handled here, so no screen below this line has to know
 * that the data arrives asynchronously.
 *
 * Two sections are still missing rather than stubbed — the goal and export —
 * because the work they present belongs to TRJ-01 and DAT-01. A section that
 * cannot do anything is worse than one that is not there.
 */
export function SettingsContainer() {
  const { preference, setPreference } = useTheme()
  const storage = resolveStream(useAtomValue(storageAtom))

  return (
    <SettingsScreen>
      <SettingsSection
        title={SETTINGS_COPY.appearance.title}
        description={SETTINGS_COPY.appearance.description}
      >
        <ThemeControl preference={preference} onChange={setPreference} />
      </SettingsSection>

      <SettingsSection
        title={SETTINGS_COPY.household.title}
        description={SETTINGS_COPY.household.description}
      >
        <HouseholdContainer />
      </SettingsSection>

      <SettingsSection
        title={SETTINGS_COPY.storage.title}
        description={SETTINGS_COPY.storage.description}
      >
        {Match.valueTags(storage, {
          Idle: () => <p className="text-muted text-sm">{SETTINGS_COPY.storage.checking}</p>,
          Loading: () => <p className="text-muted text-sm">{SETTINGS_COPY.storage.checking}</p>,
          Success: ({ value }) => <StoragePanel {...value} />,
          Failure: () => (
            <FailureState
              title={SETTINGS_COPY.storage.failed}
              detail={SETTINGS_COPY.storage.failedDetail}
            />
          ),
          Defect: () => (
            <FailureState
              title={SETTINGS_COPY.storage.failed}
              detail={SETTINGS_COPY.storage.failedDetail}
            />
          )
        })}
      </SettingsSection>
    </SettingsScreen>
  )
}
