/**
 * What a Trivia Night content item is: a question, its options and the answer (ADR 0015). Scripts load this file on
 * its own (to check packs and generate JSON Schemas), so it imports only zod and the SDK's content helpers.
 */
import { z } from 'zod'
import { checkAnswer, choiceFields } from '../../sdk/content/choices'
import type { ItemKey } from '../../sdk/content/duplicates'
import { Tag } from '../../sdk/content/pack'

/** True when no value appears twice. */
const noRepeats = (list: readonly string[]) => new Set(list).size === list.length

/**
 * One Trivia Night question:
 *
 *   { "question": "What is 7 × 8?", "options": ["56", "54", "48", "64"], "answer": "56", "tags": ["maths"] }
 *
 * An optional `subtitle` is shown in smaller text under the question.
 *
 * The options are shuffled (or put A to Z) when the question comes up, so their order here doesn't matter.
 */
export const itemSchema = z
  .strictObject({
    ...choiceFields,
    tags: z
      .array(Tag)
      .refine(noRepeats, 'Remove the repeated tag')
      .default([])
      .meta({ description: 'What the question is about, e.g. "maths" or "science". Players can filter by tag.', uniqueItems: true }),
  })
  .superRefine(checkAnswer)

export type TriviaItem = z.infer<typeof itemSchema>

/** Two questions with the same wording are the same question, whatever their options. */
export const itemKey: ItemKey<TriviaItem> = (item) => item.question
