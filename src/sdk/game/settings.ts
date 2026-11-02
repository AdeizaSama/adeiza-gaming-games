import type { ComponentType } from 'react'

/** Every setting except the teams, which players always name themselves: what a settings view and a preset deal in. */
export type Settings<Config> = Omit<Config, 'teams'>

/** What a game's settings view receives (ADR 0008). */
export interface SettingsViewProps<Config> {
  /** The current settings, the game's own included. */
  settings: Settings<Config>
  /** Reports the settings players changed, e.g. `{ mode: 'mix' }`. The setup screen checks them with the schema. */
  onChange: (changes: Partial<Settings<Config>>) => void
}

/** A game's own settings on the setup screen, shown below the format's (ADR 0008). */
export type SettingsView<Config> = ComponentType<SettingsViewProps<Config>>
