import { z } from 'zod'
import { packSchema } from '../../src/sdk/content/pack'
import { VariantFile } from '../../src/sdk/content/variant'
import { themeSchema } from '../../src/sdk/theme/schema'

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

/** The file the theme JSON Schema is written to, inside `schemas/`. */
export const themeSchemaFileName = 'theme.schema.json'

/** The JSON Schema for theme files (ADR 0010), built from the zod schema the app and CI use, like a pack's. */
export function themeJsonSchema(): Record<string, unknown> {
  return { ...z.toJSONSchema(themeSchema, { io: 'input', target: 'draft-7' }), title: 'Ku Zo Wasa theme' }
}

/** The file the variant JSON Schema is written to, inside `schemas/`: one for every game (ADR 0018). */
export const variantSchemaFileName = 'variant.schema.json'

/**
 * The JSON Schema for variant files: their shape. Whether `settings` fit the game is checked by the tests
 * (`defineGame`), which know the game, so here `settings` is any object.
 */
export function variantJsonSchema(): Record<string, unknown> {
  return { ...z.toJSONSchema(VariantFile, { io: 'input', target: 'draft-7' }), title: 'Ku Zo Wasa variant' }
}

/** The text written to the file: 2-space indents and a final newline, so it reads well and diffs cleanly. */
export function schemaFileText(schema: Record<string, unknown>): string {
  return `${JSON.stringify(schema, null, 2)}\n`
}
