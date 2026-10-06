import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** A game folder, as the content scripts see it: where its schemas are and which pack files it has. */
export interface GameFolder {
  /** The folder name, which is the game's id, e.g. `charades`. */
  id: string
  /** The game's `schema.ts` (exports `itemSchema` and `itemKey`), or null if the folder has none. */
  schemaFile: string | null
  /** Every `content/*.json` file, sorted by name. */
  packFiles: string[]
}

/** The names of the entries in `dir` that match `keep`, sorted so the output is the same on every computer. */
function list(dir: string, keep: (entry: { name: string; isDirectory(): boolean }) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(keep)
    .map((entry) => entry.name)
    .sort()
}

/**
 * Lists the game folders in `gamesDir` (normally `src/games`), sorted by id. Returns an empty list if the folder
 * doesn't exist yet. Only reads folder contents; it doesn't open any files.
 */
export function findGames(gamesDir: string): GameFolder[] {
  if (!existsSync(gamesDir)) return []

  return list(gamesDir, (entry) => entry.isDirectory()).map((id) => {
    const schemaFile = join(gamesDir, id, 'schema.ts')
    const contentDir = join(gamesDir, id, 'content')
    const packFiles = existsSync(contentDir)
      ? list(contentDir, (entry) => !entry.isDirectory() && entry.name.endsWith('.json')).map((name) => join(contentDir, name))
      : []
    return { id, schemaFile: existsSync(schemaFile) ? schemaFile : null, packFiles }
  })
}
