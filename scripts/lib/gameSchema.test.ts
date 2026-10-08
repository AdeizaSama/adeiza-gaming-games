import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { loadGameSchema, readGameSchema } from './gameSchema'

const itemSchema = z.object({ text: z.string() })
const itemKey = (item: { text: string }) => item.text

describe('readGameSchema', () => {
  it('returns itemSchema and itemKey when both are exported', () => {
    expect(readGameSchema({ itemSchema, itemKey, Other: 1 }, 'schema.ts')).toEqual({ itemSchema, itemKey })
  })

  it('says when itemSchema is missing or is not a zod schema', () => {
    expect(() => readGameSchema({ itemKey }, 'schema.ts')).toThrow('schema.ts must export `itemSchema`')
    expect(() => readGameSchema({ itemSchema: { text: 'string' }, itemKey }, 'schema.ts')).toThrow(
      'schema.ts must export `itemSchema`',
    )
  })

  it('says when itemKey is missing', () => {
    expect(() => readGameSchema({ itemSchema }, 'schema.ts')).toThrow('schema.ts must export `itemKey`')
  })
})

describe('loadGameSchema', () => {
  it("loads a real game's schema.ts from a file path", async () => {
    const file = join(fileURLToPath(new URL('../..', import.meta.url)), 'src', 'games', 'charades', 'schema.ts')
    const { itemSchema: loaded, itemKey: key } = await loadGameSchema(file)
    expect(loaded.parse({ text: 'Gala' })).toEqual({ text: 'Gala', tags: [], modes: ['describe'] })
    expect(key({ text: 'Gala' })).toBe('Gala')
  })
})
