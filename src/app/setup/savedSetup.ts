import { z } from 'zod'
import { defaultSettings, withoutTeams, type Settings } from '../../sdk/game/settings'

/**
 * A game's setup choices as players left them: every setting except teams, the game's own included (ADR 0008).
 * Kept per game so an unfinished setup survives a back swipe or a refresh. Team names are kept separately, shared by
 * every game (`savedTeams.ts`).
 */
export type SetupChoices<Config> = Settings<Config>

/** What `loadSetup` and `defaultSetup` need from a game. */
interface SetupGame<Config> {
  meta: { id: string }
  content: { packs: readonly { id: string }[] }
  config: { schema: z.ZodType<Config> }
}

const key = (gameId: string) => `ku-zo-wasa:setup:${gameId}`

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

/** Saves a game's setup choices. Does nothing if storage is switched off. */
export function saveSetup<Config>(gameId: string, choices: SetupChoices<Config>, storage: Storage = localStorage): void {
  try {
    storage.setItem(key(gameId), JSON.stringify(choices))
  } catch {
    // Storage full or switched off: remembering is a nicety.
  }
}
