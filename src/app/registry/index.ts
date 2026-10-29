import charades from '../../games/charades'

/**
 * Every game players can pick. The only place in the app that imports games (standard §9): to add a game, import
 * its definition here and add it to the list.
 */
export const games = [charades]

/** The game with this id (the first part of its URL, e.g. `/charades`), or `undefined` if there's none. */
export function findGame(id: string | undefined) {
  return games.find((game) => game.meta.id === id)
}
