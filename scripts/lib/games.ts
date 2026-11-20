import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** A game folder, as the content scripts see it: where its schemas are and which pack and variant files it has. */
export interface GameFolder {
  /** The folder name, which is the game's id, e.g. `charades`. */
  id: string
  /** The game's `schema.ts` (exports `itemSchema` and `itemKey`), or null if the folder has none. */
  schemaFile: string | null
  /** Every `content/*.json` file, sorted by name. */
  packFiles: string[]
  /** Every `variants/*.json` file, sorted by name (ADR 0018). */
  variantFiles: string[]
}

/** The names of the entries in `dir` that match `keep`, sorted so the output is the same on every computer. */
function list(dir: string, keep: (entry: { name: string; isDirectory(): boolean }) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(keep)
    .map((entry) => entry.name)
    .sort()
}

/** The `.json` files directly in `dir`, sorted, as full paths; none if it doesn't exist. */
function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return list(dir, (entry) => !entry.isDirectory() && entry.name.endsWith('.json')).map((name) => join(dir, name))
}

/**
 * Lists the game folders in `gamesDir` (normally `src/games`), sorted by id. Returns an empty list if the folder
 * doesn't exist yet. Only reads folder contents; it doesn't open any files.
 */
export function findGames(gamesDir: string): GameFolder[] {
  if (!existsSync(gamesDir)) return []

  return list(gamesDir, (entry) => entry.isDirectory()).map((id) => {
    const schemaFile = join(gamesDir, id, 'schema.ts')
    return {
      id,
      schemaFile: existsSync(schemaFile) ? schemaFile : null,
      packFiles: jsonFiles(join(gamesDir, id, 'content')),
      variantFiles: jsonFiles(join(gamesDir, id, 'variants')),
    }
  })
}
