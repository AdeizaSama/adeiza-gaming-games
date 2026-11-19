import charades from '../../games/charades'
import nameTen from '../../games/name-ten'
import thisOrThat from '../../games/this-or-that'
import triviaNight from '../../games/trivia-night'
import type { Game } from '../../sdk/game/defineGame'

/**
 * A game, with its own types forgotten: some kind of item, settings, turn and events. Each game is fully type-checked
 * where it's defined (`defineGame`); the app only ever handles a game as a whole (its packs with its item key, its
 * machine with its views, its save with its schema), so it doesn't need to know which game it has.
 *
 * Without this, a list of different games is "Charades or Name Ten or…", and TypeScript can't tell that the packs
 * and the item key it takes from one game belong together. TypeScript has no way to say "some types, the same ones
 * throughout" for a list of mixed games, so `any` stands in for them here, and only here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- why: see the comment above
export type AnyGame = Game<any, any, any, any, any, any, any, any>

/**
 * Every game players can pick. The only place in the app that imports games (standard §9): to add a game, import
 * its definition here and add it to the list.
 */
export const games: readonly AnyGame[] = [charades, nameTen, triviaNight, thisOrThat]

/** The game with this id (the first part of its URL, e.g. `/charades`), or `undefined` if there's none. */
export function findGame(id: string | undefined): AnyGame | undefined {
  return games.find((game) => game.meta.id === id)
}
