import { z } from 'zod'

/** Who a pack is suitable for. The library filters packs by it. */
export const Maturity = z.enum(['everyone', 'teen', 'adult'])

/** Lowercase words joined by single hyphens, e.g. `anime` or `movies-90s`. Used for pack ids and tags. */
const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** A tag on an item, e.g. `snack` or `tv-show`. Games use it in their item schemas, so every game's tags look alike. */
export const Tag = z
  .string()
  .regex(kebabCase, 'Use lowercase words joined by hyphens, e.g. "tv-show"')
  .meta({ description: 'Lowercase words joined by hyphens, e.g. "snack" or "tv-show".' })

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
 *
 * Each `description` is shown by editors when you hover over the field in a pack file (via the JSON Schema).
 */
export const PackInfo = z.strictObject({
  $schema: z
    .string()
    .optional()
    .meta({ description: 'Lets your editor check this file and suggest fields. Leave it as it is.' }),
  id: z
    .string()
    .regex(kebabCase, 'Use lowercase words joined by hyphens, e.g. "movies-90s"')
    .meta({ description: 'Must match the file name: "movies-90s" for movies-90s.json.' }),
  name: z.string().trim().min(1).meta({ description: 'The pack name players see, e.g. "Back to School".' }),
  description: z.string().trim().min(1).meta({ description: 'One or two sentences telling players what is in the pack.' }),
  language: z
    .string()
    .regex(languageTag, 'Use a language code like "en" or "pt-BR"')
    .meta({ description: 'The language players read the pack in, as a code: "en", "en-NG", "fr", "yo"…' }),
  maturity: Maturity.meta({ description: 'Who the pack suits: "everyone", "teen" or "adult".' }),
  contributors: z
    .array(z.string().max(39).regex(githubHandle, 'Use a GitHub username, e.g. "AdeizaSama"'))
    .min(1, 'List at least one contributor')
    .meta({ description: 'GitHub usernames of the people who wrote the pack, without "@". Add yours.' }),
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
    items: z.array(itemSchema).min(1, 'A pack needs at least one item').meta({ description: 'The items in the pack.' }),
  })
}
