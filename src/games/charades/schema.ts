/**
 * What a Charades content item is. Scripts load this file on its own (to check packs and generate JSON Schemas),
 * so it imports only zod and the SDK's content helpers: never React, views or other game files.
 */
import { z } from 'zod'
import type { ItemKey } from '../../sdk/content/duplicates'
import { Tag } from '../../sdk/content/pack'

/** How a team member can give the clue: talk around it, act it out silently, or sing or hum it. */
export const CharadesMode = z.enum(['describe', 'act', 'sing'])

/** True when no value appears twice. */
const noRepeats = (list: readonly string[]) => new Set(list).size === list.length

/**
 * One Charades item. Only `text` is required:
 *
 *   { "text": "Puff puff" }                                     → tags [], modes ["describe"]
 *   { "text": "National Anthem", "tags": ["ritual"], "modes": ["describe", "act", "sing"] }
 */
//
// `.meta({ description })` is shown when hovering over a field in an editor. `uniqueItems: true` tells editors what
// `noRepeats` checks: JSON Schema can't carry a zod `.refine()` function, so it's dropped from the generated schema.
export const itemSchema = z.strictObject({
  // At most 50 characters, so it stays readable on a phone at arm's length.
  text: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .meta({ description: 'What the team has to guess. At most 50 characters.' }),
  tags: z
    .array(Tag)
    .refine(noRepeats, 'Remove the repeated tag')
    .default([])
    .meta({ description: 'What kind of thing it is, e.g. "snack" or "game". Players can filter by tag.', uniqueItems: true }),
  modes: z
    .array(CharadesMode)
    .min(1, 'List at least one mode, or leave "modes" out for describe only')
    .refine(noRepeats, 'Remove the repeated mode')
    .default(['describe'])
    .meta({
      description: 'How it can be clued: "describe", "act" (silently) or "sing" (or hum). Leave it out for describe only.',
      uniqueItems: true,
    }),
})

export type CharadesItem = z.infer<typeof itemSchema>

/** Two items with the same text are the same item, whatever their tags or modes. */
export const itemKey: ItemKey<CharadesItem> = (item) => item.text
