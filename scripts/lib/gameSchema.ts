import { pathToFileURL } from 'node:url'
import { z } from 'zod'
import type { ItemKey } from '../../src/sdk/content/duplicates'

/** What every game's `schema.ts` must export for the content scripts. */
export interface GameSchema {
  itemSchema: z.ZodType
  itemKey: ItemKey<unknown>
}

/**
 * Checks that a loaded `schema.ts` exports `itemSchema` (a zod schema) and `itemKey` (a function).
 * Throws a message saying what's missing: a game developer's mistake, so it should be loud.
 */
export function readGameSchema(exports: Record<string, unknown>, file: string): GameSchema {
  const { itemSchema, itemKey } = exports
  if (!(itemSchema instanceof z.ZodType)) {
    throw new Error(`${file} must export \`itemSchema\`, the zod schema for one content item`)
  }
  if (typeof itemKey !== 'function') {
    throw new Error(`${file} must export \`itemKey\`, a function from an item to the text that identifies it`)
  }
  return { itemSchema, itemKey: itemKey as ItemKey<unknown> }
}

/** Loads a game's `schema.ts` and checks its exports. */
export async function loadGameSchema(file: string): Promise<GameSchema> {
  // `import()` needs a URL, not a Windows path like C:\…, so the path is converted first.
  const exports: Record<string, unknown> = await import(pathToFileURL(file).href)
  return readGameSchema(exports, file)
}
