/**
 * What a Name Ten content item is: a category and its answers (ADR 0012). Scripts load this file on its own (to check
 * packs and generate JSON Schemas), so it imports only zod and the SDK's content helpers.
 */
import { z } from 'zod'
import { findDuplicates, type ItemKey } from '../../sdk/content/duplicates'
import { Tag } from '../../sdk/content/pack'

/** True when no value appears twice. */
const noRepeats = (list: readonly string[]) => new Set(list).size === list.length

/**
 * One Name Ten category:
 *
 *   { "category": "Things Found in a School Bag", "answers": ["exercise book", "biro", …], "tags": ["school"] }
 *
 * A turn deals 10 to 15 of the answers onto the judge's board, so a category needs at least 10. Up to 20 are allowed
 * for categories where every extra answer is one people really say.
 */
export const itemSchema = z.strictObject({
  category: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .meta({ description: 'What the team names things from, e.g. "Things Found in a School Bag". At most 60 characters.' }),
  answers: z
    .array(z.string().trim().min(1).max(50))
    .min(10, 'List at least 10 answers: a turn deals up to 15 onto the board')
    .max(20, 'List at most 20 answers: the first 10 to 15 people shout should be the ones here')
    .superRefine((answers, context) => {
      for (const duplicate of findDuplicates(answers, (answer) => answer)) {
        context.addIssue({ code: 'custom', path: [duplicate.index], message: `"${duplicate.key}" is already an answer at answers.${duplicate.firstIndex}` })
      }
    })
    .meta({
      description: 'The answers, 10 to 20, each at most 50 characters. Put the most obvious first. Use the name people say.',
    }),
  tags: z
    .array(Tag)
    .refine(noRepeats, 'Remove the repeated tag')
    .default([])
    .meta({ description: 'What kind of category it is, e.g. "school" or "food". Players can filter by tag.', uniqueItems: true }),
})

export type NameTenItem = z.infer<typeof itemSchema>

/** Two categories with the same name are the same category, whatever their answers. */
export const itemKey: ItemKey<NameTenItem> = (item) => item.category
