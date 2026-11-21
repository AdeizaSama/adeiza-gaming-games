import { z } from 'zod'
import type { Variant } from '../../sdk/content/variant'
import { defaultSettings, freePlaySettings, variantSettings, withOpenChanges, withoutTeams, type FreePlay, type Settings } from '../../sdk/game/settings'

/**
 * A game's setup choices as players left them: every setting except teams, the game's own included (ADR 0008).
 * Kept per game, and per variant (ADR 0018), so an unfinished setup survives a back swipe or a refresh. Team names are kept separately, shared by
 * every game (`savedTeams.ts`).
 */
export type SetupChoices<Config> = Settings<Config>

/** What `loadSetup` and `defaultSetup` need from a game. */
interface SetupGame<Config> {
  meta: { id: string }
  content: { packs: readonly { id: string }[] }
  config: { schema: z.ZodType<Config> }
}

/** Where a setup is kept: `charades` for the game's own setup, `charades/naija-back-to-school` for a variant's. */
const key = (setupId: string) => `ku-zo-wasa:setup:${setupId}`

/** The id a variant's setup is kept under. */
export const variantSetupId = (gameId: string, variant: Pick<Variant, 'id'>) => `${gameId}/${variant.id}`

/** Placeholder teams: only the choices are being checked, and teams are never part of them. */
const placeholderTeams = ['Team 1', 'Team 2']

/** The outside shape. Whether the values are still allowed is checked against the game's schema in `loadSetup`. */
const Saved = z.looseObject({ packs: z.array(z.string()) })

/** The game's defaults, from its schema, with every pack chosen. */
export function defaultSetup<Config>(game: SetupGame<Config>): SetupChoices<Config> {
  return defaultSettings(game.config.schema, game.content.packs.map((pack) => pack.id))
}

/**
 * The saved choices for a game, or `undefined` to use the defaults. Packs that no longer exist are dropped; if none
 * are left, or the choices no longer pass the game's settings schema, the save is ignored. A setting the game added
 * since the save gets its default from the schema.
 */
export function loadSetup<Config>(game: SetupGame<Config>, storage: Storage = localStorage): SetupChoices<Config> | undefined {
  try {
    const saved = Saved.safeParse(JSON.parse(storage.getItem(key(game.meta.id)) ?? 'null'))
    if (!saved.success) return undefined
    const packs = saved.data.packs.filter((id) => game.content.packs.some((pack) => pack.id === id))
    if (packs.length === 0) return undefined
    const settings = game.config.schema.safeParse({ ...saved.data, packs, teams: placeholderTeams })
    return settings.success ? withoutTeams(settings.data) : undefined
  } catch {
    return undefined // not JSON, or storage switched off
  }
}

/**
 * A variant's setup (ADR 0018): its own settings, with what players changed last time on top, for the open settings
 * only. A change to a setting the variant has closed since, or one that no longer passes the schema, is dropped.
 */
export function loadVariantSetup<Config>(game: SetupGame<Config>, variant: Variant, storage: Storage = localStorage): SetupChoices<Config> {
  const settings = variantSettings(game.config.schema, variant)
  try {
    const saved: unknown = JSON.parse(storage.getItem(key(variantSetupId(game.meta.id, variant))) ?? 'null')
    if (typeof saved !== 'object' || saved === null) return settings
    const choices = withOpenChanges(settings, saved as Record<string, unknown>, variant.open)
    return game.config.schema.safeParse({ ...choices, teams: placeholderTeams }).success ? choices : settings
  } catch {
    return settings // not JSON, or storage switched off
  }
}

/** Which tab a variant's setup shows (ADR 0019): playing in teams, or alone. */
export type SetupTab = 'competitive' | 'free-play'

const tabKey = (setupId: string) => `ku-zo-wasa:setup-tab:${setupId}`

/** The id a variant's Free Play setup is kept under, next to its Competitive one. */
export const freePlaySetupId = (setupId: string) => `${setupId}/free-play`

/** The tab players last used on this setup; Competitive if none, or if storage is off. */
export function loadTab(setupId: string, storage: Storage = localStorage): SetupTab {
  try {
    return storage.getItem(tabKey(setupId)) === 'free-play' ? 'free-play' : 'competitive'
  } catch {
    return 'competitive'
  }
}

/** Remembers the tab players are on. Does nothing if storage is switched off. */
export function saveTab(setupId: string, tab: SetupTab, storage: Storage = localStorage): void {
  try {
    storage.setItem(tabKey(setupId), tab)
  } catch {
    // Storage full or switched off: remembering is a nicety.
  }
}

/**
 * A variant's Free Play setup (ADR 0019): `freePlaySettings`, with what players chose last time in Free Play on top.
 * Kept apart from the variant's Competitive setup, so each tab remembers its own.
 */
export function loadFreePlaySetup<Config>(
  game: SetupGame<Config>,
  variant: Variant,
  freePlay: Pick<FreePlay<Config>, 'settings'>,
  storage: Storage = localStorage,
): SetupChoices<Config> {
  let saved: unknown = null
  try {
    saved = JSON.parse(storage.getItem(key(freePlaySetupId(variantSetupId(game.meta.id, variant)))) ?? 'null')
  } catch {
    // Not JSON, or storage switched off: start from the variant's Free Play.
  }
  const changes = typeof saved === 'object' && saved !== null ? (saved as Record<string, unknown>) : {}
  return freePlaySettings(game.config.schema, variant, freePlay, changes)
}

/**
 * Saves a setup's choices: `setupId` is the game's id, or `variantSetupId` for a variant's. Does nothing if storage
 * is switched off.
 */
export function saveSetup<Config>(setupId: string, choices: SetupChoices<Config>, storage: Storage = localStorage): void {
  try {
    storage.setItem(key(setupId), JSON.stringify(choices))
  } catch {
    // Storage full or switched off: remembering is a nicety.
  }
}
