import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { loadGameSchema } from './gameSchema'
import { findGames } from './games'
import { packJsonSchema, schemaFileName, schemaFileText } from './jsonSchema'

// A stand-in item schema with one required field and one with a default, like Charades' `text` and `modes`.
const TestItem = z.strictObject({ text: z.string(), modes: z.array(z.string()).default(['describe']) })

describe('packJsonSchema', () => {
  const schema = packJsonSchema('test', TestItem)
  const properties = schema.properties as Record<string, { items?: Record<string, unknown> }>

  it('requires the shared pack fields, but not $schema', () => {
    expect(schema.required).toEqual(['id', 'name', 'description', 'language', 'maturity', 'contributors', 'items'])
  })

  it('rejects unknown fields in packs and items, as the zod schema does', () => {
    expect(schema.additionalProperties).toBe(false)
    expect(properties.items.items?.additionalProperties).toBe(false)
  })

  it('makes item fields with a default optional, since contributors can leave them out', () => {
    expect(properties.items.items?.required).toEqual(['text'])
  })

  it('names the game in its title', () => {
    expect(schema.title).toBe('Ku Zo Wasa content pack: test')
  })
})

describe('schema files', () => {
  it('are named after the game', () => {
    expect(schemaFileName('charades')).toBe('charades.pack.schema.json')
  })

  it('are written with 2-space indents and a final newline', () => {
    expect(schemaFileText({ a: 1 })).toBe('{\n  "a": 1\n}\n')
  })
})

describe('the committed schemas/ folder', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const schemasDir = join(root, 'schemas')
  const games = findGames(join(root, 'src', 'games')).filter((game) => game.schemaFile !== null)

  // If this fails after changing a schema.ts or the pack format: run `pnpm generate-schemas` and commit the result.
  it('matches the zod schemas (run `pnpm generate-schemas` if not)', async () => {
    for (const game of games) {
      const { itemSchema } = await loadGameSchema(game.schemaFile!)
      const file = join(schemasDir, schemaFileName(game.id))
      const committed = existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '(missing)'
      expect(committed, file).toBe(schemaFileText(packJsonSchema(game.id, itemSchema)))
    }
  })

  it('has no schemas for games that no longer exist', () => {
    const expected = games.map((game) => schemaFileName(game.id)).sort()
    expect(readdirSync(schemasDir).sort()).toEqual(expected)
  })
})
