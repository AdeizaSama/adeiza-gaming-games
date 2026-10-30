import { z } from 'zod'
import { isFinal } from '../../sdk/machine/runner'
import type { MachineState } from '../../sdk/machine/types'
import { findGame, games } from '../registry'

/**
 * The saved game: one per device, in localStorage (ADR 0006).
 *
 * **Bump `saveVersion`** in any change to the shape of a saved context (a format's or game's context, items or
 * turn record). Older saves are then thrown away with a notice instead of loaded wrong.
 */
export const saveVersion = 1
const key = 'ku-zo-wasa:game'

type AnyGame = (typeof games)[number]

/** The state a game's machine plays, worked out from the game: its context type and its phase names. */
export type StateOf<G extends AnyGame> = MachineState<
  ReturnType<G['machine']['context']>,
  Extract<keyof G['machine']['phases'], string>
>

/** What's written to storage. Only the outside is checked by shape; the checks in `read` cover the rest. */
const SavedGame = z.object({
  version: z.number(),
  gameId: z.string(),
  savedAt: z.number(),
  state: z.object({
    phase: z.string(),
    context: z.object({ config: z.unknown() }).loose(),
    rngState: z.number(),
  }),
})

type Read =
  | { status: 'none' }
  | { status: 'discarded'; reason: string }
  | { status: 'ok'; game: AnyGame; savedAt: number; state: MachineState<{ config: unknown }, string> }

/**
 * Reads the save and checks it against today's app. A save that fails a check is deleted, and the reason returned
 * so the app can tell players their game couldn't be restored.
 */
function read(storage: Storage): Read {
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { status: 'none' } // storage switched off: there's nothing to read
  }
  if (raw === null) return { status: 'none' }

  const discard = (reason: string): Read => {
    clearGame(storage)
    return { status: 'discarded', reason }
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return discard('the save is not readable')
  }
  const saved = SavedGame.safeParse(json)
  if (!saved.success) return discard('the save is not a saved game')

  const { version, gameId, savedAt, state } = saved.data
  if (version !== saveVersion) return discard(`the save is from an older version of the app (save version ${version})`)
  const game = findGame(gameId)
  if (!game) return discard(`there's no game "${gameId}" any more`)
  // hasOwn, not `in`: `in` also finds what every object inherits, so a phase called "toString" would pass.
  if (!Object.hasOwn(game.machine.phases, state.phase)) return discard(`${game.meta.name} has no "${state.phase}" phase any more`)
  if (!game.config.schema.safeParse(state.context.config).success) return discard(`its ${game.meta.name} settings aren't valid any more`)

  return { status: 'ok', game, savedAt, state }
}

/** Saves a game, replacing any other. If storage is full or switched off, the game goes on unsaved. */
export function saveGame<G extends AnyGame>(game: G, state: StateOf<G>, storage: Storage = localStorage, now = Date.now()): void {
  try {
    storage.setItem(key, JSON.stringify({ version: saveVersion, gameId: game.meta.id, savedAt: now, state }))
  } catch {
    // Nothing to do: the game still plays, as before saving existed.
  }
}

/** Deletes the saved game. */
export function clearGame(storage: Storage = localStorage): void {
  try {
    storage.removeItem(key)
  } catch {
    // Storage switched off: there's nothing saved to delete.
  }
}

/**
 * The saved game for one game, to play it: nothing, a save that had to be thrown away, a save for a different game,
 * or the state to resume.
 */
export function loadGame<G extends AnyGame>(
  game: G,
  storage: Storage = localStorage,
):
  | { status: 'none' }
  | { status: 'discarded'; reason: string }
  | { status: 'other game'; gameId: string }
  | { status: 'ok'; state: StateOf<G>; savedAt: number } {
  const saved = read(storage)
  if (saved.status !== 'ok') return saved
  if (saved.game.meta.id !== game.meta.id) return { status: 'other game', gameId: saved.game.meta.id }
  // The checks in `read` passed for this game, and the version rule covers the rest of the context (ADR 0006).
  return { status: 'ok', state: saved.state as unknown as StateOf<G>, savedAt: saved.savedAt }
}

/** What the library shows about the saved game, without playing it. */
export interface SaveSummary {
  game: AnyGame
  teams: string[]
  round: number
  rounds: number
  /** At the results: shown as nothing to continue. */
  finished: boolean
  savedAt: number
}

/** A summary of the saved game for the library, or why there isn't one. */
export function summarizeSave(
  storage: Storage = localStorage,
): { status: 'none' } | { status: 'discarded'; reason: string } | { status: 'ok'; summary: SaveSummary } {
  const saved = read(storage)
  if (saved.status !== 'ok') return saved
  const { game, savedAt } = saved
  const state = saved.state as unknown as StateOf<AnyGame>
  const { config, round } = state.context
  return {
    status: 'ok',
    summary: { game, teams: config.teams, round, rounds: config.rounds, finished: isFinal(game.machine, state), savedAt },
  }
}
