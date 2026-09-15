import { useSyncExternalStore } from "react"

import {
  readPreference,
  resolve,
  subscribe,
  type Theme,
  type ThemePreference,
  writePreference
} from "@/shell/theme/Theme"

export interface ThemeControl {
  readonly preference: ThemePreference
  readonly theme: Theme
  readonly setPreference: (preference: ThemePreference) => void
}

export const useTheme = (): ThemeControl => {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const)
  return { preference, theme: resolve(preference), setPreference: writePreference }
}
