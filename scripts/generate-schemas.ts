/**
 * Writes a JSON Schema for each game's content packs to `schemas/<game>.pack.schema.json`.
 * Run with `pnpm generate-schemas` after changing a game's `schema.ts` or the pack format, and commit the result.
 * A test (scripts/lib/jsonSchema.test.ts) fails if the committed files are out of date.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGameSchema } from './lib/gameSchema'
import { findGames } from './lib/games'
import { packJsonSchema, schemaFileName, schemaFileText } from './lib/jsonSchema'

const root = fileURLToPath(new URL('..', import.meta.url))
const schemasDir = join(root, 'schemas')

mkdirSync(schemasDir, { recursive: true })

for (const game of findGames(join(root, 'src', 'games'))) {
  if (!game.schemaFile) {
    console.log(`${game.id}: skipped, no schema.ts`)
    continue
  }
  const { itemSchema } = await loadGameSchema(game.schemaFile)
  const file = join(schemasDir, schemaFileName(game.id))
  writeFileSync(file, schemaFileText(packJsonSchema(game.id, itemSchema)))
  console.log(`${game.id}: wrote schemas/${schemaFileName(game.id)}`)
}
