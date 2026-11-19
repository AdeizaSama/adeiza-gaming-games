/**
 * What a This or That content item is: a question with exactly two options (ADR 0017). Scripts load this file on its
 * own (to check packs and generate JSON Schemas), so it imports only zod and the SDK's content helpers.
 */
import { z } from 'zod'
import { checkAnswer, choiceFields } from '../../sdk/content/choices'
import type { ItemKey } from '../../sdk/content/duplicates'
import { Tag } from '../../sdk/content/pack'

/** True when no value appears twice. */
const noRepeats = (list: readonly string[]) => new Set(list).size === list.length

/**
 * One This or That question:
 *
 *   { "question": "chaise", "subtitle": "chair", "options": ["Masculin", "Féminin"], "answer": "Féminin", "tags": ["noun"] }
 *
 * The SDK's question fields (`choiceFields`), with exactly two options. They're shown A to Z unless the players
 * change it, so every question in a pack with the same two options shows them in the same place.
 */
export const itemSchema = z
  .strictObject({
    ...choiceFields,
    options: choiceFields.options
      .refine((options) => options.length === 2, 'Give exactly 2 options: This or That is one or the other')
      .meta({ description: 'The two options, e.g. ["Masculin", "Féminin"]. The answer is one of them.' }),
    tags: z
      .array(Tag)
      .refine(noRepeats, 'Remove the repeated tag')
      .default([])
      .meta({ description: 'What kind of question it is, e.g. "noun" or "clothes". Players can filter by tag.', uniqueItems: true }),
  })
  .superRefine(checkAnswer)

export type ThisOrThatItem = z.infer<typeof itemSchema>

/** Two questions with the same wording are the same question. */
export const itemKey: ItemKey<ThisOrThatItem> = (item) => item.question
