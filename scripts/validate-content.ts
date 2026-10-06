/**
 * Checks every content pack in src/games. Run with `pnpm validate-content`.
 *
 * For now it only lists the games and pack files it finds; the checks themselves are added in chapter 02, step 8.
 */
import { fileURLToPath } from 'node:url'
import { findGames } from './lib/games'

// The games folder, found from this file's location so the script works from any working directory.
const gamesDir = fileURLToPath(new URL('../src/games', import.meta.url))

const games = findGames(gamesDir)

if (games.length === 0) console.log(`No games found in ${gamesDir}`)

for (const game of games) {
  const schema = game.schemaFile ? 'schema.ts' : 'no schema.ts'
  console.log(`${game.id}: ${schema}, ${game.packFiles.length} pack file(s)`)
}
