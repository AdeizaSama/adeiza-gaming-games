/**
 * The rules for a multiple-choice question's options, shared by every multiple-choice game (ADR 0015). A game's
 * `schema.ts` uses them, so scripts load this file on its own: it imports only zod and the SDK's content helpers.
 */
import { z } from 'zod'
import type { Rng } from '../rng'
import { findDuplicates } from './duplicates'

/** The fewest and most options a question can have. Five is what fits under a question on a small phone. */
export const minOptions = 2
export const maxOptions = 5

/**
 * A question's options: 2 to 5, each 1–80 characters, none repeated (ignoring capitals and spaces, as item keys are
 * compared). Two options that only differ in capitals would look like the same answer to players.
 */
export const Options = z
  .array(z.string().trim().min(1).max(80, 'Keep each option to 80 characters'))
  .min(minOptions, `Give at least ${minOptions} options`)
  .max(maxOptions, `Give at most ${maxOptions} options: more don't fit under the question`)
  .superRefine((options, context) => {
    for (const duplicate of findDuplicates(options, (option) => option)) {
      context.addIssue({ code: 'custom', path: [duplicate.index], message: `"${duplicate.key}" is already an option at options.${duplicate.firstIndex}` })
    }
  })

/**
 * A question's fields, for a multiple-choice game's item schema (ADR 0017). Spread them into the game's own object,
 * with its tags, and check the answer:
 *
 *   export const itemSchema = z.strictObject({ ...choiceFields, tags }).superRefine(checkAnswer)
 */
export const choiceFields = {
  question: z
    .string()
    .trim()
    .min(1)
    .max(150, 'Keep the question to 150 characters: it has to fit above its options')
    .meta({ description: 'The question, as players read it. At most 150 characters.' }),
  subtitle: z
    .string()
    .trim()
    .min(1)
    .max(100, 'Keep the subtitle to 100 characters: it goes under the question')
    .optional()
    .meta({ description: 'Optional. A smaller line under the question, e.g. a hint or a translation. At most 100 characters.' }),
  options: Options.meta({
    description: 'What players pick from: 2 to 5, each at most 80 characters, none repeated. The answer is one of them.',
  }),
  answer: z
    .string()
    .trim()
    .min(1)
    .meta({ description: 'The right option, written exactly as it is in options.' }),
}

/**
 * Checks that an item's `answer` is one of its `options`, written the same way. Use it on the whole item, after the
 * fields are checked:
 *
 *   export const itemSchema = z.strictObject({ question, options: Options, answer, tags }).superRefine(checkAnswer)
 *
 * Written the same way, not just the same letters: the answer is what the machine compares a pick with, so "lagos"
 * would never match the option "Lagos".
 */
export function checkAnswer(item: { options: readonly string[]; answer: string }, context: z.RefinementCtx) {
  if (!item.options.includes(item.answer)) {
    context.addIssue({ code: 'custom', path: ['answer'], message: 'The answer must be one of the options, written the same way' })
  }
}

/** How a question's options are put in order on screen. */
export const OptionOrder = z.enum(['shuffle', 'alphabetical'])
export type OptionOrder = z.infer<typeof OptionOrder>

/** A to Z, ignoring capitals, with numbers in number order: "8" before "12", "Year 9" before "Year 10". */
const byName = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

/**
 * The options in the order players see them, as a new list:
 *
 * - `shuffle`: a new order each time, from the machine's random numbers, so a saved game shows the same order again.
 * - `alphabetical`: A to Z (see `byName`). The same question always shows the same order.
 *
 * A game whose options have a fixed meaning by position (masculin always on the left) doesn't call this at all.
 */
export function orderOptions(options: readonly string[], order: OptionOrder, rng: Rng): string[] {
  return order === 'shuffle' ? rng.shuffle(options) : [...options].sort(byName.compare)
}
