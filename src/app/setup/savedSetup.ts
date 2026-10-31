import { z } from 'zod'
import type { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'

/**
 * A game's setup choices as players left them (rounds, turn length, packs, tags), kept per game so an unfinished
 * setup survives a back swipe or a refresh. Team names are kept separately, shared by every game (`savedTeams.ts`).
 */
export type SetupChoices = Pick<TeamTurnsConfig, 'rounds' | 'seconds' | 'packs' | 'tags'>

const key = (gameId: string) => `ku-zo-wasa:setup:${gameId}`

/** The outside shape. Whether the values are still allowed is checked against the game in `loadSetup`. */
const Saved = z.object({ rounds: z.number(), seconds: z.number(), packs: z.array(z.string()), tags: z.array(z.string()) })

/**
 * The saved choices for a game, or `undefined` to use the defaults. Packs that no longer exist are dropped; if none
 * are left, or the choices no longer pass the game's settings schema, the save is ignored.
 */
export function loadSetup(
  game: { meta: { id: string }; content: { packs: readonly { id: string }[] }; config: { schema: z.ZodType } },
  storage: Storage = localStorage,
): SetupChoices | undefined {
  try {
    const saved = Saved.safeParse(JSON.parse(storage.getItem(key(game.meta.id)) ?? 'null'))
    if (!saved.success) return undefined
    const packs = saved.data.packs.filter((id) => game.content.packs.some((pack) => pack.id === id))
    if (packs.length === 0) return undefined
    const choices = { ...saved.data, packs }
    // Placeholder teams: only the choices themselves are being checked.
    return game.config.schema.safeParse({ ...choices, teams: ['Team 1', 'Team 2'] }).success ? choices : undefined
  } catch {
    return undefined // not JSON, or storage switched off
  }
}

/** Saves a game's setup choices. Does nothing if storage is switched off. */
export function saveSetup(gameId: string, choices: SetupChoices, storage: Storage = localStorage): void {
  try {
    storage.setItem(key(gameId), JSON.stringify(choices))
  } catch {
    // Storage full or switched off: remembering is a nicety.
  }
}
