import { useSyncExternalStore } from "react"

import { type Theme, type ThemePreference, themeStore } from "@/shell/theme/Theme"

export interface ThemeControl {
  readonly preference: ThemePreference
  readonly theme: Theme
  readonly setPreference: (preference: ThemePreference) => void
}

export const useTheme = (): ThemeControl => {
  const preference = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.preference,
    () => "system" as const
  )
  return { preference, theme: themeStore.theme(), setPreference: themeStore.set }
}
