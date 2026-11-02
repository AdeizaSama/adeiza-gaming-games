import type { ComponentType } from 'react'
import type { z } from 'zod'
import type { TeamTurnsConfig } from '../formats/team-turns/config'

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

/** Stand-ins for the parts of the settings a check doesn't look at: teams, and packs when a preset names none. */
const placeholderTeams = ['Team 1', 'Team 2']
const placeholderPacks = ['placeholder']

/** Settings without the teams. */
export function withoutTeams<Config>(settings: Config): Settings<Config> {
  const rest = { ...settings }
  delete (rest as { teams?: unknown }).teams
  return rest
}

/** The schema's defaults, for these packs. */
export function defaultSettings<Config>(schema: z.ZodType<Config>, packs: string[]): Settings<Config> {
  return withoutTeams(schema.parse({ teams: placeholderTeams, packs }))
}

/** What a preset sets (ADR 0008): every setting but teams, packs (unless it names some) and tags. */
interface PresetLike {
  config: object
  packs?: string[]
}

/**
 * The settings after tapping a preset (ADR 0008): the game's defaults plus the preset's own changes. Packs and tags
 * stay as they are, unless the preset names packs. Throws if the preset's settings fail the schema; `defineGame`
 * checks every preset, so that's a bug.
 */
export function presetSettings<Config extends TeamTurnsConfig>(
  schema: z.ZodType<Config>,
  preset: PresetLike,
  current: Pick<TeamTurnsConfig, 'packs' | 'tags'>,
): Settings<Config> {
  const settings = schema.parse({ ...preset.config, teams: placeholderTeams, packs: preset.packs ?? placeholderPacks })
  return { ...withoutTeams(settings), packs: preset.packs ?? current.packs, tags: current.tags }
}

/**
 * Whether the settings are exactly what the preset sets (ADR 0008): a preset is shown as selected only then. Teams
 * and tags are never compared, and packs only if the preset names some (in any order).
 */
export function matchesPreset<Config extends TeamTurnsConfig>(
  schema: z.ZodType<Config>,
  preset: PresetLike,
  current: Settings<Config>,
): boolean {
  const expected: Record<string, unknown> = presetSettings(schema, preset, current)
  const actual: Record<string, unknown> = { ...current }
  if (preset.packs) {
    expected.packs = [...preset.packs].sort()
    actual.packs = [...current.packs].sort()
  }
  return sameValue(expected, actual)
}

/** Whether two settings values are the same: numbers, strings, booleans, and arrays and objects of them. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
  )
}
