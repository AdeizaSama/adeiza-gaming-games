import { z } from 'zod'

/** Who a pack is suitable for. The library filters packs by it. */
export const Maturity = z.enum(['everyone', 'teen', 'adult'])

/** Lowercase words joined by single hyphens, e.g. `anime` or `movies-90s`. Used for pack ids and tags. */
const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** A tag on an item, e.g. `snack` or `tv-show`. Games use it in their item schemas, so every game's tags look alike. */
export const Tag = z.string().regex(kebabCase, 'Use lowercase words joined by hyphens, e.g. "tv-show"')

/** A GitHub username: letters, digits and single hyphens, not starting or ending with a hyphen, at most 39 characters. */
const githubHandle = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/

/**
 * A language tag (BCP 47), simplified: a 2–3 letter language code, optionally followed by parts like
 * a region or script. Examples: `en`, `en-GB`, `pt-BR`, `yo`, `zh-Hans`.
 */
const languageTag = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

/**
 * The fields every pack has, whatever the game. Strict: an unknown field (often a typo like `maturty`)
 * is an error instead of being silently ignored.
 */
export const PackInfo = z.strictObject({
  /** Path to the generated JSON Schema, so editors can autocomplete and check the file. Not used by the game. */
  $schema: z.string().optional(),
  id: z.string().regex(kebabCase, 'Use lowercase words joined by hyphens, e.g. "movies-90s"'),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  language: z.string().regex(languageTag, 'Use a language code like "en" or "pt-BR"'),
  maturity: Maturity,
  contributors: z
    .array(z.string().max(39).regex(githubHandle, 'Use a GitHub username, e.g. "AdeizaSama"'))
    .min(1, 'List at least one contributor'),
})

export type PackInfo = z.infer<typeof PackInfo>

/** A content pack: the shared fields, plus items in the shape the game decides. */
export interface Pack<Item> extends PackInfo {
  items: Item[]
}

/**
 * The schema for one game's packs: the shared fields, plus `items` checked against the game's item schema.
 *
 *   const CharadesPack = packSchema(CharadesItem)
 */
export function packSchema<ItemSchema extends z.ZodType>(itemSchema: ItemSchema) {
  return PackInfo.extend({
    items: z.array(itemSchema).min(1, 'A pack needs at least one item'),
  })
}
