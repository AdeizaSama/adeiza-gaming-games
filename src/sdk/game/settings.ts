import type { ComponentType } from 'react'
import type { z } from 'zod'
import type { Variant } from '../content/variant'

/** Every setting except the teams, which players always name themselves: what a settings view deals in. */
export type Settings<Config> = Omit<Config, 'teams'>

/** What a game's settings view receives (ADR 0008). */
export interface SettingsViewProps<Config> {
  /** The current settings, the game's own included. */
  settings: Settings<Config>
  /** Reports the settings players changed, e.g. `{ mode: 'mix' }`. The setup screen checks them with the schema. */
  onChange: (changes: Partial<Settings<Config>>) => void
  /**
   * On a variant's setup, the settings players may change (ADR 0018): the view shows only those (use `isOpen`).
   * Undefined on a game's own setup, where every setting is shown.
   */
  open?: readonly string[]
}

/** A game's own settings on the setup screen, shown below the format's (ADR 0008). */
export type SettingsView<Config> = ComponentType<SettingsViewProps<Config>>

/** Whether a setting is shown: on a game's own setup (no `open` list) every one is; on a variant's, the open ones. */
export function isOpen(open: readonly string[] | undefined, name: string): boolean {
  return open === undefined || open.includes(name)
}

/** Stand-ins for teams: players name their own, so a check of the other settings uses these. */
const placeholderTeams = ['Team 1', 'Team 2']

/** Settings a variant never opens: players always name their teams, and the content is what makes the variant. */
const neverOpen = new Set(['teams', 'packs', 'tags'])

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

/** The names of the settings a variant may open: every setting of the game but teams, packs and tags. */
export function openableSettings<Config>(schema: z.ZodType<Config>, packs: string[]): string[] {
  return Object.keys(defaultSettings(schema, packs) as object).filter((name) => !neverOpen.has(name))
}

/** What `variantSettings` reads from a variant. */
type VariantLike = Pick<Variant, 'settings' | 'packs' | 'tags'>

/** A variant's settings, checked: the game's defaults, the variant's changes, and its packs and tags. */
export function checkVariantSettings<Config>(schema: z.ZodType<Config>, variant: VariantLike) {
  return schema.safeParse({ ...variant.settings, teams: placeholderTeams, packs: variant.packs, tags: variant.tags })
}

/**
 * A variant's settings (ADR 0018): the game's defaults, the variant's changes, and its packs and tags. Throws if they
 * fail the schema; `defineGame` checks every variant, so that's a bug.
 */
export function variantSettings<Config>(schema: z.ZodType<Config>, variant: VariantLike): Settings<Config> {
  const checked = checkVariantSettings(schema, variant)
  if (!checked.success) throw checked.error
  return withoutTeams(checked.data)
}

/**
 * `settings`, with players' own `changes` to the open settings on top, and nothing else from `changes`: what a
 * variant's setup starts from when players have changed it before. A change to a closed setting is ignored, so a
 * variant that closes a setting later still gets its own value.
 */
export function withOpenChanges<Config>(settings: Settings<Config>, changes: Record<string, unknown>, open: readonly string[]): Settings<Config> {
  const allowed = Object.fromEntries(Object.entries(changes).filter(([name]) => open.includes(name) && !neverOpen.has(name)))
  return { ...settings, ...allowed }
}
