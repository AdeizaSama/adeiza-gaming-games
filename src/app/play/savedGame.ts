import { z } from 'zod'
import type { Variant } from '../../sdk/content/variant'
import { isFinal } from '../../sdk/machine/runner'
import type { MachineState } from '../../sdk/machine/types'
import { findGame, games } from '../registry'

/**
 * The saved game: one per device, in localStorage (ADR 0006).
 *
 * **Bump `saveVersion`** in any change to the shape of a saved context (a format's or game's context, items or
 * turn record). Older saves are then thrown away with a notice instead of loaded wrong.
 *
 * 1: the first saves (chapter 05). 2: Charades logs each card with its mode, and has mode and points settings
 * (ADR 0007).
 */
export const saveVersion = 2
const key = 'ku-zo-wasa:game'

type AnyGame = (typeof games)[number]

/** The state a game's machine plays, worked out from the game: its context type and its phase names. */
export type StateOf<G extends AnyGame> = MachineState<
  ReturnType<G['machine']['context']>,
  Extract<keyof G['machine']['phases'], string>
>

/**
 * What's written to storage. Only the outside is checked by shape; the checks in `read` cover the rest.
 * `variantId` (ADR 0018) is optional, so saves from before variants still load without a version bump.
 */
const SavedGame = z.object({
  version: z.number(),
  gameId: z.string(),
  variantId: z.string().optional(),
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
  | { status: 'ok'; game: AnyGame; variant?: Variant; savedAt: number; state: MachineState<{ config: unknown }, string> }

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

  const { version, gameId, variantId, savedAt, state } = saved.data
  if (version !== saveVersion) return discard(`the save is from an older version of the app (save version ${version})`)
  const game = findGame(gameId)
  if (!game) return discard(`there's no game "${gameId}" any more`)
  // hasOwn, not `in`: `in` also finds what every object inherits, so a phase called "toString" would pass.
  if (!Object.hasOwn(game.machine.phases, state.phase)) return discard(`${game.meta.name} has no "${state.phase}" phase any more`)
  if (!game.config.schema.safeParse(state.context.config).success) return discard(`its ${game.meta.name} settings aren't valid any more`)

  // A variant that's gone since doesn't spoil the save: the game plays the same, under the game's own name.
  const variant = game.variants.find((candidate) => candidate.id === variantId)
  return { status: 'ok', game, variant, savedAt, state }
}

/** Where a save goes, and what it remembers beyond the game: options for `saveGame`. */
export interface SaveOptions {
  /** The variant the game was started from (ADR 0018), so the library can name it. */
  variantId?: string
  storage?: Storage
  now?: number
}

/** Saves a game, replacing any other. If storage is full or switched off, the game goes on unsaved. */
export function saveGame<G extends AnyGame>(game: G, state: StateOf<G>, { variantId, storage = localStorage, now = Date.now() }: SaveOptions = {}): void {
  try {
    storage.setItem(key, JSON.stringify({ version: saveVersion, gameId: game.meta.id, variantId, savedAt: now, state }))
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
  | { status: 'ok'; state: StateOf<G>; savedAt: number; variantId?: string } {
  const saved = read(storage)
  if (saved.status !== 'ok') return saved
  if (saved.game.meta.id !== game.meta.id) return { status: 'other game', gameId: saved.game.meta.id }
  // The checks in `read` passed for this game, and the version rule covers the rest of the context (ADR 0006).
  return { status: 'ok', state: saved.state as unknown as StateOf<G>, savedAt: saved.savedAt, variantId: saved.variant?.id }
}

/** What the library shows about the saved game, without playing it. */
export interface SaveSummary {
  game: AnyGame
  /** The variant it was started from, if any (ADR 0018). */
  variant?: Variant
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
  const { game, variant, savedAt } = saved
  const state = saved.state as unknown as StateOf<AnyGame>
  const { config, round } = state.context
  return {
    status: 'ok',
    summary: { game, variant, teams: config.teams, round, rounds: config.rounds, finished: isFinal(game.machine, state), savedAt },
  }
}

/** What players call the saved game: its variant's name, or the game's if it wasn't started from one. */
export function saveName({ game, variant }: Pick<SaveSummary, 'game' | 'variant'>): string {
  return variant?.name ?? game.meta.name
}

/** "Lions vs Eagles · Round 2 of 3", or "Lions, Eagles and Hawks · …" for more teams, or "Free Play" for one player. */
export function describeSave({ teams, round, rounds }: Pick<SaveSummary, 'teams' | 'round' | 'rounds'>): string {
  if (teams.length === 1) return 'Free Play'
  const names = teams.length === 2 ? `${teams[0]} vs ${teams[1]}` : `${teams.slice(0, -1).join(', ')} and ${teams.at(-1)}`
  return `${names} · Round ${round} of ${rounds}`
}
