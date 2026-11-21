/**
 * What a Pairs content item is: a pair (ADR 0020). Scripts load this file on its own (to check packs and generate JSON
 * Schemas), so it imports only zod and the SDK's content helpers.
 */
import { z } from 'zod'
import type { ItemKey } from '../../sdk/content/duplicates'
import { Tag } from '../../sdk/content/pack'

/** True when no value appears twice. */
const noRepeats = (list: readonly string[]) => new Set(list).size === list.length

/**
 * One pair:
 *
 *   { "front": "le chat", "back": "cat", "tags": ["animals"] }          a two-way pack: a word and its partner
 *   { "front": "le chat", "back": "les animaux", "tags": ["animals"] }  a one-way pack: a word and its group
 *
 * In a two-way pack each back belongs to one front (match-up needs it); in a one-way pack many fronts share a back
 * (odd-one-out needs it). The variant says which its pack is.
 */
export const itemSchema = z.strictObject({
  front: z
    .string()
    .trim()
    .min(1)
    .max(60, 'Keep each side to 60 characters: it has to fit on a tile')
    .meta({ description: 'The side shown first, e.g. "le chat". At most 60 characters.' }),
  back: z
    .string()
    .trim()
    .min(1)
    .max(60, 'Keep each side to 60 characters: it has to fit on a tile')
    .meta({ description: 'Its partner ("cat"), or its group ("les animaux"). At most 60 characters.' }),
  tags: z
    .array(Tag)
    .refine(noRepeats, 'Remove the repeated tag')
    .default([])
    .meta({ description: 'What the pair is about, e.g. "animals" or "food". Players can filter by tag.', uniqueItems: true }),
})

export type PairsItem = z.infer<typeof itemSchema>

/** Two pairs with the same front are the same pair. */
export const itemKey: ItemKey<PairsItem> = (item) => item.front
