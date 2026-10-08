import { z } from 'zod'
import { packSchema } from '../../src/sdk/content/pack'

/** The file a game's pack JSON Schema is written to, inside `schemas/`. */
export function schemaFileName(gameId: string): string {
  return `${gameId}.pack.schema.json`
}

/**
 * The JSON Schema for one game's packs, built from the same zod schema the app and CI use.
 *
 * - `io: 'input'` describes what a contributor *writes*, so fields with a default (like Charades' `modes`) are
 *   optional. The default output would describe what the game *receives*, where every field is filled in.
 * - `target: 'draft-7'` is the JSON Schema version editors support most widely.
 */
export function packJsonSchema(gameId: string, itemSchema: z.ZodType): Record<string, unknown> {
  return {
    ...z.toJSONSchema(packSchema(itemSchema), { io: 'input', target: 'draft-7' }),
    title: `Ku Zo Wasa content pack: ${gameId}`,
  }
}

/** The text written to the file: 2-space indents and a final newline, so it reads well and diffs cleanly. */
export function schemaFileText(schema: Record<string, unknown>): string {
  return `${JSON.stringify(schema, null, 2)}\n`
}
